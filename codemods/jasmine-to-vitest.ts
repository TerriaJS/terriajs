import type {
  API,
  FileInfo,
  Options,
  ASTPath,
  CallExpression,
  MemberExpression
} from "jscodeshift";

export default function transform(file: FileInfo, api: API, _options: Options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let modified = false;

  // jasmine.createSpy('name') → vi.fn()
  // jasmine.createSpy() → vi.fn()
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "jasmine" },
        property: { type: "Identifier", name: "createSpy" }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.node.callee = j.memberExpression(
        j.identifier("vi"),
        j.identifier("fn")
      );
      path.node.arguments = [];
      modified = true;
    });

  // spyOn(obj, 'method') → vi.spyOn(obj, 'method')
  root
    .find(j.CallExpression, {
      callee: { type: "Identifier", name: "spyOn" }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.node.callee = j.memberExpression(
        j.identifier("vi"),
        j.identifier("spyOn")
      );
      modified = true;
    });

  // .and.returnValue(x) → .mockReturnValue(x)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "returnValue" },
        object: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "and" }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const callee = path.node.callee as MemberExpression;
      const andObj = callee.object as MemberExpression;
      path.node.callee = j.memberExpression(
        andObj.object,
        j.identifier("mockReturnValue")
      );
      modified = true;
    });

  // .and.callFake(fn) → .mockImplementation(fn)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "callFake" },
        object: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "and" }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const callee = path.node.callee as MemberExpression;
      const andObj = callee.object as MemberExpression;
      path.node.callee = j.memberExpression(
        andObj.object,
        j.identifier("mockImplementation")
      );
      modified = true;
    });

  // .and.callThrough() → remove the .and.callThrough() call entirely
  // (Vitest spies call through by default)
  // Replace entire expression with just the spy reference
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "callThrough" },
        object: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "and" }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const callee = path.node.callee as MemberExpression;
      const andObj = callee.object as MemberExpression;
      // If this is a standalone statement like `spy.and.callThrough()`,
      // replace with just the spy reference.
      // If it's chained like `spyOn(...).and.callThrough()`,
      // replace with `vi.spyOn(...)`
      path.replace(andObj.object);
      modified = true;
    });

  // .calls.count() → .mock.calls.length
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "count" },
        object: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "calls" }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const callee = path.node.callee as MemberExpression;
      const callsObj = callee.object as MemberExpression;
      path.replace(
        j.memberExpression(
          j.memberExpression(
            j.memberExpression(callsObj.object, j.identifier("mock")),
            j.identifier("calls")
          ),
          j.identifier("length")
        )
      );
      modified = true;
    });

  // .calls.argsFor(n) → .mock.calls[n]
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "argsFor" },
        object: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "calls" }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const callee = path.node.callee as MemberExpression;
      const callsObj = callee.object as MemberExpression;
      const arg = path.node.arguments[0];
      path.replace(
        j.memberExpression(
          j.memberExpression(
            j.memberExpression(callsObj.object, j.identifier("mock")),
            j.identifier("calls")
          ),
          arg as any,
          true // computed
        )
      );
      modified = true;
    });

  // .calls.mostRecent().args → .mock.lastCall
  // .calls.mostRecent() → { args: spy.mock.lastCall }
  // Handle .calls.mostRecent().args first (more specific)
  root
    .find(j.MemberExpression, {
      property: { type: "Identifier", name: "args" },
      object: {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "mostRecent" },
          object: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "calls" }
          }
        }
      }
    })
    .forEach((path: ASTPath<MemberExpression>) => {
      const callExpr = path.node.object as CallExpression;
      const callee = callExpr.callee as MemberExpression;
      const callsObj = callee.object as MemberExpression;
      path.replace(
        j.memberExpression(
          j.memberExpression(callsObj.object, j.identifier("mock")),
          j.identifier("lastCall")
        )
      );
      modified = true;
    });

  // .calls.mostRecent() → .mock.lastCall (standalone)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "mostRecent" },
        object: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "calls" }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const callee = path.node.callee as MemberExpression;
      const callsObj = callee.object as MemberExpression;
      path.replace(
        j.memberExpression(
          j.memberExpression(callsObj.object, j.identifier("mock")),
          j.identifier("lastCall")
        )
      );
      modified = true;
    });

  // .calls.reset() → .mockReset()
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "reset" },
        object: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "calls" }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const callee = path.node.callee as MemberExpression;
      const callsObj = callee.object as MemberExpression;
      path.node.callee = j.memberExpression(
        callsObj.object,
        j.identifier("mockReset")
      );
      modified = true;
    });

  // .calls.allArgs() → .mock.calls
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "allArgs" },
        object: {
          type: "MemberExpression",
          property: { type: "Identifier", name: "calls" }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const callee = path.node.callee as MemberExpression;
      const callsObj = callee.object as MemberExpression;
      path.replace(
        j.memberExpression(
          j.memberExpression(callsObj.object, j.identifier("mock")),
          j.identifier("calls")
        )
      );
      modified = true;
    });

  // jasmine.clock().install() → vi.useFakeTimers()
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "install" },
        object: {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "jasmine" },
            property: { type: "Identifier", name: "clock" }
          }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.replace(
        j.callExpression(
          j.memberExpression(j.identifier("vi"), j.identifier("useFakeTimers")),
          []
        )
      );
      modified = true;
    });

  // jasmine.clock().uninstall() → vi.useRealTimers()
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "uninstall" },
        object: {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "jasmine" },
            property: { type: "Identifier", name: "clock" }
          }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.replace(
        j.callExpression(
          j.memberExpression(j.identifier("vi"), j.identifier("useRealTimers")),
          []
        )
      );
      modified = true;
    });

  // jasmine.clock().tick(ms) → vi.advanceTimersByTime(ms)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "tick" },
        object: {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "jasmine" },
            property: { type: "Identifier", name: "clock" }
          }
        }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.replace(
        j.callExpression(
          j.memberExpression(
            j.identifier("vi"),
            j.identifier("advanceTimersByTime")
          ),
          path.node.arguments
        )
      );
      modified = true;
    });

  // jasmine.any(Type) → expect.any(Type)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "jasmine" },
        property: { type: "Identifier", name: "any" }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.node.callee = j.memberExpression(
        j.identifier("expect"),
        j.identifier("any")
      );
      modified = true;
    });

  // jasmine.objectContaining(obj) → expect.objectContaining(obj)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "jasmine" },
        property: { type: "Identifier", name: "objectContaining" }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.node.callee = j.memberExpression(
        j.identifier("expect"),
        j.identifier("objectContaining")
      );
      modified = true;
    });

  // jasmine.arrayContaining(arr) → expect.arrayContaining(arr)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "jasmine" },
        property: { type: "Identifier", name: "arrayContaining" }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.node.callee = j.memberExpression(
        j.identifier("expect"),
        j.identifier("arrayContaining")
      );
      modified = true;
    });

  // jasmine.stringMatching(str) → expect.stringMatching(str)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "jasmine" },
        property: { type: "Identifier", name: "stringMatching" }
      }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.node.callee = j.memberExpression(
        j.identifier("expect"),
        j.identifier("stringMatching")
      );
      modified = true;
    });

  // fail('message') → throw new Error('message')
  // fail(error) → throw error
  root
    .find(j.CallExpression, {
      callee: { type: "Identifier", name: "fail" }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      const arg = path.node.arguments[0];
      if (arg && arg.type === "StringLiteral") {
        path.replace(
          j.throwStatement(j.newExpression(j.identifier("Error"), [arg]))
        );
      } else if (arg) {
        path.replace(j.throwStatement(arg as any));
      } else {
        path.replace(
          j.throwStatement(
            j.newExpression(j.identifier("Error"), [
              j.stringLiteral("Test failed")
            ])
          )
        );
      }
      modified = true;
    });

  // Remove `import "../SpecMain"` or similar SpecMain imports
  root
    .find(j.ImportDeclaration)
    .filter((path) => {
      const source = path.node.source.value;
      return typeof source === "string" && source.includes("SpecMain");
    })
    .forEach((path) => {
      path.prune();
      modified = true;
    });

  // xdescribe → describe.skip, xit → it.skip
  root.find(j.Identifier, { name: "xdescribe" }).forEach((path) => {
    path.replace(
      j.memberExpression(j.identifier("describe"), j.identifier("skip"))
    );
    modified = true;
  });
  root.find(j.Identifier, { name: "xit" }).forEach((path) => {
    path.replace(j.memberExpression(j.identifier("it"), j.identifier("skip")));
    modified = true;
  });

  // fdescribe → describe.only, fit → it.only
  root.find(j.Identifier, { name: "fdescribe" }).forEach((path) => {
    path.replace(
      j.memberExpression(j.identifier("describe"), j.identifier("only"))
    );
    modified = true;
  });
  root
    .find(j.CallExpression, {
      callee: { type: "Identifier", name: "fit" }
    })
    .forEach((path: ASTPath<CallExpression>) => {
      path.node.callee = j.memberExpression(
        j.identifier("it"),
        j.identifier("only")
      );
      modified = true;
    });

  if (!modified) {
    return undefined;
  }

  return root.toSource({ quote: "double" });
}
