#!/usr/bin/env bash
# Posts a visual tests run's outcome on its PR, in one comment it keeps up to
# date: each difference's before | diff | after image, stored on a branch so
# the comment can show it. With no differences it only updates a comment the
# PR already has, so a clean run doesn't notify anyone.
#
# With STAGE=running, as a run starts, it marks a comment the PR already has as
# running again, and collapses its results as the previous ones.
#
# Takes from the environment: GH_TOKEN, REPO, PR, RUN_ID, RUN_URL, SHA, BASE,
# OUTCOME (the comparison step's: success or failure) and VISUAL_SCREENSHOTS,
# whose __report__ folder holds the combined images
set -euo pipefail

# It names folders on the storage branch
[[ "$PR" =~ ^[0-9]+$ ]] || { echo "PR must be a number: $PR" >&2; exit 1; }

marker="<!-- visual-tests-report -->"
branch="visual-tests-storage"
# A comment holds 65536 characters; each image takes about 300
limit=100
report="$VISUAL_SCREENSHOTS/__report__"
body=$(mktemp)

images=()
if [ -d "$report" ]; then
  while IFS= read -r image; do images+=("$image"); done < <(
    cd "$report" && find . -name '*.png' | sed 's|^\./||' | sort
  )
fi
count=${#images[@]}

# Replaces the PR's images on the storage branch with this run's. Done afresh
# from the branch's latest commit, so a push that lost a race to another PR's
# run just tries again
store() {
  local storage
  storage=$(mktemp -d)
  cd "$storage"
  git init -q
  git remote add origin "https://x-access-token:$GH_TOKEN@github.com/$REPO.git"
  if git fetch -q --depth 1 origin "$branch" 2> /dev/null; then
    git checkout -q -B "$branch" FETCH_HEAD
  else
    git checkout -q --orphan "$branch"
  fi
  rm -rf "pr-$PR"
  mkdir -p "pr-$PR/$RUN_ID"
  cp -R "$report/." "pr-$PR/$RUN_ID/"
  git add -A
  git -c user.name="github-actions[bot]" \
    -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
    commit -q -m "Visual differences for #$PR, run $RUN_ID"
  git push -q origin "HEAD:$branch"
}

# A PR closed while this ran has had its images removed (design-system-visual-cleanup.yml),
# so nothing's stored or posted for it
state=$(gh api "repos/$REPO/pulls/$PR" --jq .state)
[ "$state" = "open" ] || exit 0

existing=$(gh api "repos/$REPO/issues/$PR/comments" --paginate \
  --jq ".[] | select(.body | startswith(\"$marker\")) | .id" | head -n 1)

if [ "${STAGE:-}" = "running" ]; then
  [ -n "$existing" ] || exit 0
  old=$(gh api "repos/$REPO/issues/comments/$existing" --jq .body)
  running="<!-- visual-tests-running -->"
  if grep -qF "$running" <<< "$old"; then
    # Already running again: its collapsed previous results stay as they are
    previous=$(sed -n '/^<details><summary><strong>Previous results/,$p' <<< "$old")
  else
    # The finished report, without its marker, each difference collapsed too
    previous=$(printf '<details><summary><strong>Previous results</strong></summary>\n\n%s\n\n</details>' \
      "$(sed -e '1d' -e 's/<details open>/<details>/' <<< "$old")")
  fi
  # shellcheck disable=SC2016 # The backticks are Markdown
  printf '%s\n%s\n## ⏳ Visual tests: running again\n\n%s compared with `%s`: [the run](%s)\n\n%s\n' \
    "$marker" "$running" "$SHA" "$BASE" "$RUN_URL" "$previous" > "$body"
  gh api -X PATCH "repos/$REPO/issues/comments/$existing" -F body=@"$body" > /dev/null
  exit 0
fi

if [ "$count" -gt 0 ]; then
  for attempt in 1 2 3; do
    (store) && break
    [ "$attempt" -lt 3 ] || exit 1
  done
  {
    echo "$marker"
    echo "## Visual tests: $count differences"
    echo
    echo "$SHA compared with \`$BASE\`, each as before ← diff → after. [The run]($RUN_URL)"
    shown=0
    for image in "${images[@]}"; do
      [ "$shown" -lt "$limit" ] || break
      echo
      echo "<details open><summary><strong>$image</strong></summary>"
      echo
      # Unlike raw.githubusercontent.com, this serves a private repository's
      # files to anyone who can see the repository
      echo "<img src=\"https://github.com/$REPO/blob/$branch/pr-$PR/$RUN_ID/$image?raw=true\" />"
      echo
      echo "</details>"
      shown=$((shown + 1))
    done
    if [ "$count" -gt "$limit" ]; then
      echo
      echo "And $((count - limit)) more, in the run's visual-differences artifact."
    fi
  } > "$body"
elif [ "$OUTCOME" = "success" ]; then
  [ -n "$existing" ] || exit 0
  # shellcheck disable=SC2016 # The backticks are Markdown
  printf '%s\n## Visual tests: no differences\n\n%s compared with `%s`. [The run](%s)\n' \
    "$marker" "$SHA" "$BASE" "$RUN_URL" > "$body"
else
  # shellcheck disable=SC2016 # The backticks are Markdown
  printf '%s\n## Visual tests: failed without screenshots to compare\n\n%s compared with `%s`: a test the base branch lacks a component for, or an error. [The run](%s)\n' \
    "$marker" "$SHA" "$BASE" "$RUN_URL" > "$body"
fi

if [ -n "$existing" ]; then
  gh api -X PATCH "repos/$REPO/issues/comments/$existing" -F body=@"$body" > /dev/null
else
  gh api "repos/$REPO/issues/$PR/comments" -F body=@"$body" > /dev/null
fi
