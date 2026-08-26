#!/usr/bin/env bash
# Every page must be reachable, and every sidebar entry must exist.
#
# Seven instructor pages were written and never added to a sidebar, so they were
# live on the site but reachable only by guessing the URL. Two of them -
# what-you-cannot-evaluate and honest-limitations - are the most
# credibility-building pages here, and nobody could find either.
#
# Docusaurus does not warn about this. It warns about a sidebar entry with no
# file, but a file with no sidebar entry is silently published and orphaned.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
FAILED=0

# plugin docs root : its sidebar file
PLUGINS=(
  "docs/developer:sidebarsDeveloper.ts"
  "docs/instructor:sidebarsInstructor.ts"
  "docs/admins:sidebarsAdmins.ts"
  "docs/student:sidebarsStudent.ts"
)

echo "=== every page is in a sidebar, every sidebar entry has a page ==="
for pair in "${PLUGINS[@]}"; do
  base="${pair%%:*}"; sb="${pair##*:}"
  [[ -d "$base" ]] || { echo "  FAIL  $base does not exist"; FAILED=1; continue; }
  [[ -f "$sb"   ]] || { echo "  FAIL  $sb does not exist"; FAILED=1; continue; }

  ids=$(grep -oE "'[a-zA-Z0-9_./-]+'" "$sb" | tr -d "'" | sort -u)
  # -E: BSD sed does not take \? in a basic expression, and silently leaves the
  # extension on, which makes every page look orphaned.
  files=$(find "$base" \( -name '*.md' -o -name '*.mdx' \) \
          | sed -E "s|^$base/||; s|\.mdx?$||" | sort -u)

  orphans=$(comm -23 <(echo "$files") <(echo "$ids"))
  if [[ -n "$orphans" ]]; then
    echo "  FAIL  $base: page(s) in no sidebar, so unreachable except by URL:"
    sed 's/^/          /' <<<"$orphans"
    FAILED=1
  fi

  # A sidebar id that names no file. Docusaurus fails the build on these, but
  # catching it here names the file instead of the plugin.
  dangling=$(comm -13 <(echo "$files") <(echo "$ids") | grep '/' || true)
  if [[ -n "$dangling" ]]; then
    echo "  FAIL  $sb: entries with no page:"
    sed 's/^/          /' <<<"$dangling"
    FAILED=1
  fi

  [[ -z "$orphans" && -z "$dangling" ]] && \
    echo "  PASS  $base  ($(wc -l <<<"$files" | tr -d ' ') pages)"
done

echo
echo "=== no page is served by zero plugins ==="
served=$(for pair in "${PLUGINS[@]}"; do find "${pair%%:*}" \( -name '*.md' -o -name '*.mdx' \); done | sort -u)
all=$(find docs \( -name '*.md' -o -name '*.mdx' \) | sort -u)
stray=$(comm -13 <(echo "$served") <(echo "$all"))
if [[ -n "$stray" ]]; then
  echo "  FAIL  under docs/ but served by no plugin, so not published at all:"
  sed 's/^/          /' <<<"$stray"
  FAILED=1
else
  echo "  PASS  every page under docs/ belongs to a plugin"
fi

echo
echo "=== relative links resolve ==="
broken=0
while IFS= read -r f; do
  # ](./x) and ](../x) and ](x.md) - site-absolute and external links are not
  # checked here; Docusaurus resolves those itself.
  while IFS= read -r link; do
    [[ -n "$link" ]] || continue
    target="$(dirname "$f")/${link%%#*}"
    [[ -e "$target" || -e "${target}.md" || -e "${target}.mdx" ]] && continue
    echo "  FAIL  $f -> $link"
    broken=1
  done < <(grep -oE '\]\((\.\.?/[^)]+|[A-Za-z0-9_-]+\.mdx?)\)' "$f" 2>/dev/null | sed 's/^](//; s/)$//')
done < <(find docs -name '*.md' -o -name '*.mdx')
[[ $broken -eq 0 ]] && echo "  PASS  relative links resolve" || FAILED=1

echo
[[ $FAILED -eq 0 ]] && echo "ALL PASS" || echo "SOME FAILED"
exit $FAILED
