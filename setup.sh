#!/bin/bash -l
set -euo pipefail
base_dir="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd -P)"
cd "$base_dir"

function install_node() {
  echo -n "detecting node version: " >&2
  local nodeVersion
  nodeVersion=$(node --version 2>/dev/null || true)
  echo "${nodeVersion:-n/a}" >&2

  echo -n "node install required: " >&2
  local nodeMajorVersion
  nodeMajorVersion=$(node --version 2>/dev/null | sed -E 's/[^0-9]*([0-9]+).*/\1/' || echo "0")

  if [[ $nodeMajorVersion -ge 18 ]]; then
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
    curl -fsSL -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash >/dev/null
    if [[ "${NVM_DIR:-}" == "" ]]; then
      export NVM_DIR="$HOME/.nvm"
    fi
    set +e
    . ~/.nvm/nvm.sh
    set -e
  else
    echo "no"
  fi

  echo "installing node 18 .."
  nvm install lts/hydrogen
  nvm use .
}

function install_node_modules() {
  echo -n "npm install required: " >&2
  if [[ -f ./node_modules/.package-lock.json ]]; then
    echo "no"
    return
  fi
  echo "yes"
  npm install --silent
}

install_node
install_node_modules
