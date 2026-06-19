#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# All-in-one script: local SonarQube (Docker) + scan
# Usage:
#   ./test-sonar-local.sh                # start everything + scan
#   ./test-sonar-local.sh --stop         # stop and remove the SonarQube container
#   ./test-sonar-local.sh --scan-only    # don't (re)start SonarQube, just run the scan
#
# Note: if an old container is already running with the deprecated
# "lts-community" tag (e.g. version 9.9.8, EOL), run
# "./test-sonar-local.sh --stop" first, then run it again normally
# to switch to the up-to-date "community" tag.
# ============================================================

CONTAINER_NAME="sonarqube-local"
SONAR_PORT="9000"
SONAR_HOST_URL_HOST="http://localhost:${SONAR_PORT}"               # seen from the Mac (curl, browser)
SONAR_HOST_URL_DOCKER="http://host.docker.internal:${SONAR_PORT}"  # seen from the scanner container
TOKEN_FILE=".sonar-local-token"

PROJECT_KEY="Kelec_Nextgen"
PROJECT_NAME="Kelec_Nextgen"

# --- 0. Check that Docker is installed and running ---
check_docker_running() {
  if ! command -v docker > /dev/null 2>&1; then
    echo "✗ Docker does not seem to be installed."
    echo "  macOS: Docker Desktop (brew install --cask docker), OrbStack, or Colima"
    echo "  Windows: Docker Desktop (requires WSL2)"
    echo "  Linux: Docker Engine (https://docs.docker.com/engine/install/)"
    exit 1
  fi

  if ! docker info > /dev/null 2>&1; then
    echo "✗ Docker is installed but doesn't seem to be running."
    echo "  Start Docker Desktop / OrbStack / 'colima start', then re-run this script."
    exit 1
  fi

  echo "✓ Docker is running."
}

check_docker_running

# --- 1. Argument handling ---
if [ "${1:-}" = "--stop" ]; then
  echo "→ Stopping and removing the SonarQube container..."
  docker stop "${CONTAINER_NAME}" 2>/dev/null || true
  docker rm "${CONTAINER_NAME}" 2>/dev/null || true
  rm -f "${TOKEN_FILE}"
  echo "✓ Cleaned up."
  exit 0
fi

SCAN_ONLY=false
if [ "${1:-}" = "--scan-only" ]; then
  SCAN_ONLY=true
fi

# --- 2. Start SonarQube if needed ---
if [ "${SCAN_ONLY}" = false ]; then
  if [ "$(docker ps -aq -f name="^${CONTAINER_NAME}$")" ]; then
    if [ -z "$(docker ps -q -f name="^${CONTAINER_NAME}$")" ]; then
      echo "→ Existing container found but stopped, restarting it..."
      docker start "${CONTAINER_NAME}"
    else
      echo "→ SonarQube is already running."
    fi
  else
    echo "→ Starting SonarQube (first time, this will take 1-2 minutes)..."
    docker run -d --name "${CONTAINER_NAME}" -p "${SONAR_PORT}:9000" sonarqube:community
  fi

  # --- 3. Wait until SonarQube is ready ---
  echo "→ Waiting for SonarQube to become operational..."
  for i in $(seq 1 60); do
    STATUS=$(curl -s "${SONAR_HOST_URL_HOST}/api/system/status" 2>/dev/null | grep -o '"status":"[A-Z]*"' || true)
    if echo "${STATUS}" | grep -q "UP"; then
      echo "✓ SonarQube is ready."
      break
    fi
    if [ "$i" = "60" ]; then
      echo "✗ Timeout: SonarQube did not start after 2 minutes. Check: docker logs ${CONTAINER_NAME}"
      exit 1
    fi
    sleep 2
  done
fi

# --- 4. Handle the token ---
if [ -f "${TOKEN_FILE}" ]; then
  SONAR_TOKEN=$(cat "${TOKEN_FILE}")
  echo "→ Reusing existing token (${TOKEN_FILE})."
else
  echo ""
  echo "⚠️  No token found."
  echo "   1. Open ${SONAR_HOST_URL_HOST} in your browser"
  echo "   2. Log in with admin/admin (change the password if prompted)"
  echo "   3. Go to My Account → Security → Generate Tokens"
  echo "   4. Paste the token below"
  echo ""
  read -rsp "SonarQube token: " SONAR_TOKEN
  echo ""
  echo "${SONAR_TOKEN}" > "${TOKEN_FILE}"
  echo "✓ Token saved to ${TOKEN_FILE} (remember to add it to .gitignore)."
fi

# --- 5. PR variables (adjust or export before calling the script) ---
PR_SHA="${PR_SHA:-$(git rev-parse HEAD)}"
PR_NUMBER="${PR_NUMBER:-123}"
PR_BRANCH="${PR_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
PR_BASE="${PR_BASE:-main}"

if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
  echo "→ Shallow repository detected, unshallowing..."
  git fetch --unshallow
fi

# --- 6. Run the scan ---
echo "→ Running the SonarQube scan..."
docker run --rm \
  -e SONAR_HOST_URL="${SONAR_HOST_URL_DOCKER}" \
  -e SONAR_TOKEN="${SONAR_TOKEN}" \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli \
  -Dsonar.qualitygate.wait=true \
  -Dsonar.projectKey="${PROJECT_KEY}" \
  -Dsonar.projectName="${PROJECT_NAME}" \
  -Dsonar.projectBaseDir=/usr/src \
  -Dsonar.scm.revision="${PR_SHA}"

echo ""
echo "✓ Scan complete. Results: ${SONAR_HOST_URL_HOST}/dashboard?id=${PROJECT_KEY}"