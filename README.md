# KELEC README

Welcome to Kelec.
If you are here, it means you are probably willing to contribute on the project. Thank you for that !.
The repo may not be the most easy to work on, and it may not be the best code, but we will try to make it as easy as possible with some documentation and time.

Discord link : [here](https://discord.gg/ntJayVBYGV)

## Variables to replace in environment file (make sure to rename `.env.example` to `.env`)

- `MAPS_API_KEY` -> useful only if you are developing on android. Google maps api key used to display Maps background. Could be retreived on Google Cloud Plateform.
- `GIGYA_API_KEY`
- `KAMEREON_API_KEY`
- `RTE_BASIC_AUTH` -> useful only if you are developing tempo widgets. Could be retreived [here](https://data.rte-france.com/catalog/-/api/consumption/Tempo-Like-Supply-Contract/v1.1) . Encode then to base64 `CLIENT_ID:CLIENT_SECRET` and put the result in this variable.

## To run the project

```bash
npm run start
```

and launch the app via Android Studio or Xcode.

## If you are on MacOS

If you face some issues with generating the package-lock.json file, you can use the following command to generate it :

```bash
docker run --rm -v $(pwd):/app -w /app node:24.16.0 npm install
```

# Local Sonar test

Run a SonarQube scan locally with Docker, without going through GitHub Actions.

## Prerequisites

Docker must be installed and running before using this script.

**macOS**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — `brew install --cask docker`
- or [OrbStack](https://orbstack.dev/) (lighter, faster alternative) — `brew install orbstack`
- or [Colima](https://github.com/abiosoft/colima) (CLI-only, no GUI) — `brew install colima docker && colima start`

**Windows**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (requires WSL2)

**Linux**
- [Docker Engine](https://docs.docker.com/engine/install/) — native daemon, no desktop app needed
- or Docker Desktop for Linux if you prefer a GUI

Check it's ready with:

```bash
docker info
```

## Usage

```bash
chmod +x test-sonar-local.sh
./test-sonar-local.sh
```

On first run: launches SonarQube, asks for a token (generate one at `http://localhost:9000` → My Account → Security → Generate Tokens), then runs the scan.

## Commands

```bash
./test-sonar-local.sh              # everything: start SonarQube if needed + scan
./test-sonar-local.sh --scan-only  # SonarQube already running, just re-run the scan
./test-sonar-local.sh --stop       # stop and remove the SonarQube container
```

## Results

`http://localhost:9000/dashboard?id=Kelec_Nextgen`