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
        && lhs.widgetHvacButton == rhs.widgetHvacButton
    }




    public let useNewInterface: Bool?
    public let useMiles: Bool?
    public let displayMiles: Bool?
    public let convertToMiles: Bool?
    // pre-heating button on the home screen widgets (Settings tab of the app); absent before the setting existed
    public let widgetHvacButton: Bool?

    /// Shown unless turned off in the app (preferences saved before the setting existed have no value).
    public var showsWidgetHvacButton: Bool { widgetHvacButton ?? true }

    public init(useNewInterface: Bool?, useMiles: Bool?, displayMiles: Bool?, convertToMiles: Bool?, widgetHvacButton: Bool? = nil) {
        self.useNewInterface = useNewInterface
        self.useMiles = useMiles
        self.displayMiles = displayMiles
        self.convertToMiles = convertToMiles
        self.widgetHvacButton = widgetHvacButton
    }

    public func hash(into hasher: inout Hasher){
        hasher.combine(useNewInterface)
        hasher.combine(useMiles)
        hasher.combine(displayMiles)
        hasher.combine(convertToMiles)
        hasher.combine(widgetHvacButton)
    }
}
