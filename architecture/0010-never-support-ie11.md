# 10. Never support Internet Explorer 11

Date: 2022-05-12

## Status

Proposed

## Context

A decision was made in [0003-drop-ie11-support](./0003-drop-ie11-support.md) to discontinue support for IE11 in the following way:

> 4. Deprecate IE11 support ASAP. Add dismissable message to maps warning them
>    that on November 1, users will be unable to use new releases of Terria maps
>    in IE11. During the deprecation window, we will not use features that IE11
>    doesn't support. On November 1, new releases of Terria maps will display a
>    message to IE11 users asking them to switch to another browser. They will w
>    not be able to use Terria in IE. Both messages will include a way for users
>    to send us feedback so that we can assess the impact.

We have received no negative feedback about this decision, so we will now move forward with removing IE11 support entirely.

## Decision

Drop support for IE11 forever. I.e.

> 1. Drop IE11 completely with no view of ever going back on that decision. We
>    upgrade to latest MobX, add service workers, use WASM, etc.

## Consequences

- We can remove old IE11 support code from the codebase
- Packages can be upgraded and new features such as service workers and WASM can be used
