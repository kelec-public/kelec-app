//
//  appPreferences.swift
//  renaultApi
//
//  Created by Kelyan PEGEOT SELME on 21/01/2025.
//

import Foundation

public class AppPreferences: Codable, Equatable, Hashable{
    public static func == (lhs: AppPreferences, rhs: AppPreferences) -> Bool {
        return lhs.useNewInterface == rhs.useNewInterface
        && lhs.useMiles == rhs.useMiles
        && lhs.displayMiles == rhs.displayMiles
        && lhs.convertToMiles == rhs.convertToMiles
    }




    public let useNewInterface: Bool?
    public let useMiles: Bool?
    public let displayMiles: Bool?
    public let convertToMiles: Bool?

    public init(useNewInterface: Bool?, useMiles: Bool?, displayMiles: Bool?, convertToMiles: Bool?) {
        self.useNewInterface = useNewInterface
        self.useMiles = useMiles
        self.displayMiles = displayMiles
        self.convertToMiles = convertToMiles
    }

    public func hash(into hasher: inout Hasher){
        hasher.combine(useNewInterface)
        hasher.combine(useMiles)
        hasher.combine(displayMiles)
        hasher.combine(convertToMiles)
    }
}
