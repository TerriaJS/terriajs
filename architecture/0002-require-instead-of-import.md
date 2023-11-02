# 2. Using `require` + type casting statements over `imports`

Date: 2020-08-07 recorded, decision made earlier

## Status

Accepted

## Context

### Background info

Cesium recently implemented their own typescript definitions that replaces the old community-run `@types/cesium`. As a result we've also stopped using our own typescript definitions (previously defined in `lib/ThirdParty/terriajs-cesium/index.d.ts`). However we've encountered a few problems when importing some of the declared modules in `Cesium.d.ts` in `terriajs-cesium` in that there are occasions where a function is not included as part of the declaration in `Cesium.d.ts` and so requires module augmentation.

Here's an example (_note I'll be using this example all throughout the document to explain the methods I've tried and other relevant details_): looking at `lib/Models/GltfCatalogItem.ts`, if we import the module `Axis` from `terriajs-cesium` using the standard way (`import Axis from 'terriajs-cesium/Source/Scene/Axis'`) we face the following error:

```
Property 'fromName' does not exist on type 'typeof Axis'.
```

for parts of the code that uses the `fromName` function, such as (line 57):

```ts
return Axis.fromName(this.upAxis);
```

This error comes up because the module declared in `Cesium.d.ts` only exports the enum `X`, `Y` and `Z`. So parts of the code that references `Axis.Y`, or one of the other enums, would work just fine, but other parts of the code that reference functions defined in `terriajs-cesium/Source/Scene/Axis` but not in the module, such as `Axis.fromName`, would break TS type checking, even though technically everything works fine in good old JS.

### Some of the things Kevin and Regina have tried

1. Kevin had tried to merge the enums declared in `Cesium.d.ts` into a locally declared class in the following way:

   ```ts
   declare module "terriajs-cesium/Source/Scene/Axis" {
     export default class Axis {
       static fromName(name: string): number;
     }
   }
   ```

   but as a result of this, we face the error

   ```
   TypeError: /home/regina/release/TerriaMap-mobx/packages/terriajs/lib/Models/GltfCatalogItem.ts: Duplicate declaration "Axis"
   ```

   and also another error relating to after digging through this problem we found that we can't do a declaration merge on classes, which Kevin confirmed:

   > Kevin Ring 2:18 PM
   > hmm seems classes can't be declaration merged with classes. TIL

   I've also tried to locally declare an Axis module as a class consisting of the enum types `X`, `Y`, `Z` and the `fromName` function. This didn't work because class declarations require a function implementation for every function defined in the class. Given that the functions are already implemented in Cesium it would be silly to have to re-implement the function again in this repo for various reasons - so this wasn't a good way of solving the problem.

2. I've tried to use namespaces instead of using classes to see if this would fix the problem, so I tried the following:

   ```ts
   declare module "terriajs-cesium/Source/Scene/Axis" {
     export default namespace Axis {
       let X: number;
       let Y: number;
       let Z: number;
       function fromName(name: string): number;
     }
   }
   ```

   So I tried declaring the above in `lib/ThirdParty/terriajs-cesium-extra/index.d.ts` (due to needing to refer to the `Axis` namespace in two different files `GltfCatalogItem.ts` and `GtfsCatalogItem.ts`). I found that TS can't use namespaces as a type and screams the following error:

   ```
   Cannot use namespace 'Axis' as a type.
   ```

   Given that this problem is mainly a type checking problem, rather than an implementation problem (i.e. everything runs fine if we were to use `require`, which by default casts it to type `any`), this isn't a viable solution.

3. The final method I tried was to use interfaces, which was the suggested method based on the [TS declaration merging docs](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation). Even though the modules we are importing aren't actually interfaces (`Axis` is supposed to be a class I believe), it still somewhat made sense given that we are only trying to tell TS that the function `fromName` exists in the module `Axis`, and this could be done using an interface (also +1 for not having to re-implement the function, unlike declaring a new class). So I created a declaration of the interface `Axis` in `lib/ThirdParty/terriajs-cesium-extra/index.d.ts` as follows:

   ```ts
   declare interface Axis {
     X: number;
     Y: number;
     Z: number;
     fromName(name: string): number;
   }
   ```

   This is where I found out that when importing modules using `import Axis from "..."`, TS will not make use of the Axis interface declared in `index.d.ts`, and instead retains the type that was declared in terriajs-cesium (`Cesium.d.ts`). This results in the Axis object to still be of type `enum` and I face the same problem that I encountered [above](###background-info) (exact same errors). This is where I figured using `require` instead would do the trick, because it allows us to cast the Axis object to be of type Axis interface that's declared in our `index.d.ts`.

## Decision

We'll use `require` over `import` for very special cases such as these, because we want TS to look at the type declared in lib/ThirdParty/terriajs-cesium-extra/index.d.ts. Given that `require` by default will cast the object to type `any`, we also should cast the object to the desired type/interface declared in `index.d.ts`.

## Consequences

- Inconsistency - we have to use two different ways of importing. Maybe it _might_(?) undesirably encourage people to use `require` to easily avoid type checking errors, even though it should really only be used if there are no other ways to fix the problem. And hopefully people don't just see it as "an alternative" way of importing because we should still encourage using `import` over `require`
- We have to define the `interface` along with its fields and methods names ourselves, rather than relying on Cesium's up-to-date type definitions, which means we would need to (manually?) keep it up-to-date with the Cesium's implementations. There would be a problem, say, if they remove the `fromName` function from the `Axis` class and this isn't reflected in our type declarations file - our code becomes technically incorrect and would throw runtime errors, but TS would not detect this.
