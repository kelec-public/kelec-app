// swift-tools-version: 5.7
// Car maker (Renault group, Hyundai, demo) and RTE Tempo API clients used by the iOS widgets,
// the Siri intent and the watch. Local package: previously github.com/kelec-public/renault-api-swift-client (1.0.9).

import PackageDescription

let package = Package(
    name: "renaultApi",
    platforms: [
        .macOS(.v13),
        .iOS(.v16),
        .watchOS(.v8)
    ],
    products: [
        .library(
            name: "renaultApi",
            targets: ["renaultApi"]),
    ],
    targets: [
        .target(
            name: "renaultApi",
            dependencies: [],
            path: "Sources"),
    ]
)
