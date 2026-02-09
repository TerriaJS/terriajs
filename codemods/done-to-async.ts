import type {
  API,
  FileInfo,
  Options,
  ASTPath,
  CallExpression,
  ExpressionStatement,
  FunctionExpression,
  ArrowFunctionExpression
} from "jscodeshift";

export default function transform(file: FileInfo, api: API, _options: Options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let modified = false;

  const TEST_HOOKS = new Set([
    "it",
    "beforeEach",
    "afterEach",
    "beforeAll",
    "afterAll"
  ]);

  function isTestHookCall(path: ASTPath<CallExpression>): boolean {
    const callee = path.node.callee;
    // it(...), beforeEach(...), etc.
    if (callee.type === "Identifier" && TEST_HOOKS.has(callee.name)) {
      return true;
    }
    // it.skip(...), describe.only(...), etc.
    if (
      callee.type === "MemberExpression" &&
      callee.object.type === "Identifier" &&
      TEST_HOOKS.has(callee.object.name)
    ) {
      return true;
    }
    return false;
  }

  function getCallbackArg(
    path: ASTPath<CallExpression>
  ): FunctionExpression | ArrowFunctionExpression | null {
    const args = path.node.arguments;
    // it("name", function(done) {...}) or it("name", (done) => {...})
    for (const arg of args) {
      if (
        (arg.type === "FunctionExpression" ||
          arg.type === "ArrowFunctionExpression") &&
        arg.params.length > 0 &&
        arg.params[0].type === "Identifier" &&
        arg.params[0].name === "done"
      ) {
        return arg as FunctionExpression | ArrowFunctionExpression;
      }
    }
    return null;
  }

  // Find all test hooks with done callback
  root
    .find(j.CallExpression)
    .filter((path) => isTestHookCall(path))
    .forEach((path: ASTPath<CallExpression>) => {
      const callback = getCallbackArg(path);
      if (!callback) return;

      // 1. Remove done parameter and make async
      callback.params = [];
      callback.async = true;

      // 2. Remove .then(done) from promise chains
      j(callback)
        .find(j.CallExpression, {
          callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "then" }
          }
        })
        .filter((thenPath) => {
          const args = thenPath.node.arguments;
          return (
            args.length === 1 &&
            args[0].type === "Identifier" &&
            (args[0] as any).name === "done"
          );
        })
        .forEach((thenPath) => {
          const callee = thenPath.node.callee as any;
          thenPath.replace(callee.object);
          modified = true;
        });

      // 3. Remove .catch(done.fail) from promise chains
      j(callback)
        .find(j.CallExpression, {
          callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "catch" }
          }
        })
        .filter((catchPath) => {
          const args = catchPath.node.arguments;
          return (
            args.length === 1 &&
            args[0].type === "MemberExpression" &&
            (args[0] as any).object.type === "Identifier" &&
            (args[0] as any).object.name === "done" &&
            (args[0] as any).property.type === "Identifier" &&
            (args[0] as any).property.name === "fail"
          );
        })
        .forEach((catchPath) => {
          const callee = catchPath.node.callee as any;
          catchPath.replace(callee.object);
          modified = true;
        });

      // 4. Replace done.fail(msg) calls with throw new Error(msg)
      j(callback)
        .find(j.CallExpression, {
          callee: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "done" },
            property: { type: "Identifier", name: "fail" }
          }
        })
        .forEach((failPath) => {
          const arg = failPath.node.arguments[0];
          if (arg && arg.type === "StringLiteral") {
            failPath.replace(
              j.throwStatement(j.newExpression(j.identifier("Error"), [arg]))
            );
          } else if (arg) {
            failPath.replace(j.throwStatement(arg as any));
          } else {
            failPath.replace(
              j.throwStatement(
                j.newExpression(j.identifier("Error"), [
                  j.stringLiteral("Test failed")
                ])
              )
            );
          }
          modified = true;
        });

      // 5. Remove standalone done() calls
      j(callback)
        .find(j.CallExpression, {
          callee: { type: "Identifier", name: "done" }
        })
        .forEach((donePath) => {
          // If done() is an expression statement, remove the whole statement
          const parent = donePath.parent;
          if (parent.node.type === "ExpressionStatement") {
            j(parent).remove();
          }
          modified = true;
        });

      // 6. Add await to remaining promise chains (expression statements
      //    that are call expressions — likely .then() chains)
      if (callback.body.type === "BlockStatement") {
        callback.body.body.forEach((stmt) => {
          if (
            stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "CallExpression"
          ) {
            // Check if this is a .then() chain (likely a promise)
            let node = stmt.expression as any;
            while (
              node.type === "CallExpression" &&
              node.callee.type === "MemberExpression"
            ) {
              const propName = node.callee.property.name;
              if (propName === "then" || propName === "catch") {
                // This is a promise chain — wrap in await
                stmt.expression = j.awaitExpression(stmt.expression) as any;
                modified = true;
                break;
              }
              node = node.callee.object;
            }
          }
        });
      }

      modified = true;
    });

  if (!modified) {
    return undefined;
  }

  return root.toSource({ quote: "double" });
}
