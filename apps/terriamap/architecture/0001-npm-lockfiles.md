# 1. npm lockfiles - use package-lock.json

Date: 2020-03-02

## Status

Accepted

## Context

I'm unsure about this one.

Our lockfile situation is a little messy.

Recently our TerriaMap CI builds have been failing, probably due to a recent change via travis using `yarn --frozen-lockfile` & failing when yarn's equivalent package-lock.json (yarn.lock) is out of sync (https://github.com/travis-ci/travis-build/pull/1858).

Removing yarn.lock fixes CI as travis currently thinks it's a yarn-developed project.

I don't fully understand why we have yarn.lock commited in the first place, however we DO recommend & use yarn when developing using the workspace feature.

Other things to note for this proposal:

- greenkeeper is set up to update package-lock.json and not yarn.lock
- we always cite npm in docs
- i've always used npm when doing release builds
- our other projects using things like github actions (NSW DT) use `npm ci` and not yarn

Some snippets from slack a little later:

(wing)

> maybe a simple way forward to unstuck us for now is force travis to use npm, continue to commit yarn lock (because lock files should be committed at least on the terriamap level), and revise again if needed.

(emma)

> my vote is for yarn and not npm because we use stuff like yarn workspaces and also yarn lets you do stuff like specific version relsoutions

(kevin)

> so I used to always update both yarn.lock and package-lock.json when updating TerriaMap to use a new terriajs
> that way our users can use the tool they prefer

> if you just .gitignore yarn.lock, it sorta just hides problems.. cause people who use yarn end up generating one, and then their system uses from that then on without them realizing it

(wing)

> yeah it's seeming more that we continue to use both, but we should update our release process to reflect the context & decisions made - the primary reason we are using yarn in dev is for workspaces right? i know for me that's why i use yarn in dev. but npm is the default tool that ships with node. so given that, we continue to ship with npm, and we dev however we like internally with yarn?

(crispy stephen)

> We used to use npm link, and then npm-git-dev when link failed us. Yarn is just another tool on top of npm we’re using to make dev easier. Unfortunately it comes with it’s own lockfiles and opinions, but it’s still way better than any other way we can dev with npm at the moment

## Decision

Keep both, but force travis to use npm, npm ci, package-lock.json etc(?), at the cost of having to keep yarn.lock up to date as well.

Continue building production/"gulp release" builds of TerriaMap using package-lock.json, keeping yarn.lock in source as well.

## Consequences

We still use two different tools for generating lock files, npm for releasing, yarn for developing. This could lead to instances where there are 'non-reproducible dev builds' (but always-reproducible production builds), even though a given `package.json` should resolve to roughly the same versions with the two tools.
