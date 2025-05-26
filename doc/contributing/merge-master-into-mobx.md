# Merging master (v7) into mobx (v8)

- Pull and checkout the latest mobx branch.
- Find the common ancestor between that and master: `git merge-base origin/master mobx`
- Open a comparison of all the changes in master since the common ancestor. You can do this on github by visiting e.g. https://github.com/TerriaJS/terriajs/compare/7f54929aa766e83b4608a527c5ec307bdff829b0...master (replace the commit hash with the one reported by git merge-base above). Don't merge any of the changes yet.
- `git checkout -b mobx-merge`
- `git merge origin/master`
- Resolve conflicts. The comparison you opened above may help, especially when a file was deleted into the mobx branch. You'll need to apply any relevant changes to the new (TypeScript) files in the mobx branch.
