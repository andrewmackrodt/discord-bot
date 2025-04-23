#!/bin/bash -l
set -euo pipefail
cd "$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd -P)"

display_nvm_usage="false"

function install_node() {
  echo -n "detecting node version: " >&2
  local nodeVersion
  nodeVersion=$(node --version 2>/dev/null || true)
  echo "${nodeVersion:-n/a}" >&2

  echo -n "node install required: " >&2
  local nodeMajorVersion
  nodeMajorVersion=$(node --version 2>/dev/null | sed -E 's/[^0-9]*([0-9]+).*/\1/' || echo "0")

  if [[ $nodeMajorVersion -ge 22 ]]; then
    echo "no"
    return
  fi

  echo "yes"

  echo -n "detecting nvm version: " >&2
  local nvmVersion
  nvmVersion=$(nvm --version 2>/dev/null || true)
  echo "${nvmVersion:-n/a}" >&2

  echo -n "nvm install required: " >&2

  if [[ "$nvmVersion" == "" ]]; then
    echo "yes"
    echo "installing nvm .."
    curl -fsSL -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash >/dev/null
    if [[ "${NVM_DIR:-}" == "" ]]; then
      export NVM_DIR="$HOME/.nvm"
    fi
    set +e
    . ~/.nvm/nvm.sh
    set -e
  else
    echo "no"
  fi

  echo "installing node 22 .."
  if [[ "${NVM_REPLACE_DEFAULT_ALIAS:-}" =~ TRUE|[Tt]rue|YES|[Yy]es|1 ]]; then
    nvm install lts/jod --reinstall-packages-from=current
    echo "detected NVM_REPLACE_DEFAULT_ALIAS=$NVM_REPLACE_DEFAULT_ALIAS .. replacing default node"
    nvm alias default lts/jod
  else
    nvm install lts/jod
    display_nvm_usage="true"
  fi
}

function install_node_modules() {
  echo -n "pnpm install required: " >&2
  if [[ -f ./node_modules/.pnpm/lock.yaml ]]; then
    echo "no"
    return
  fi
  echo "yes"
  if ! which pnpm >/dev/null 2>&1; then
    corepack enable
  fi
  pnpm install
}

install_node
install_node_modules

if [[ "$display_nvm_usage" == "true" ]]; then
  cat <<'EOF'

================================================================================
[NOTICE]
================================================================================
You may need to activate the node environment by running:
  nvm use .

Alternatively you can replace your default node version by running:
  nvm alias default lts/jod

If you see a command not found error, open a new shell.

EOF
fi
