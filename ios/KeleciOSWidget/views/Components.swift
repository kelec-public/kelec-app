//
//  Components.swift
//  KeleciOSWidgetExtension
//
//  Small views shared by the home screen widgets.
//

import AppIntents
import SwiftUI
import WidgetKit

// car image: base64 image saved by the app, else the placeholder "megane" image, else the Renault logo
struct CarImageView: View {
  var image: String
  var body: some View {
    if #available(iOSApplicationExtension 18.0, *) {
      resizedImage
        .widgetAccentedRenderingMode(.fullColor)
        .scaledToFit()
    } else {
      resizedImage
        .scaledToFit()
    }
  }

  private var resizedImage: Image {
    if image != "", let base64Image = Image(base64str: image) {
      return base64Image.resizable()
    }
    return Image(image == "megane" ? "megane" : "renaultLogo").resizable()
  }
}

// date (only when it is not today) and time of the last data refresh
struct LastRefreshLabel: View {
  var lastRefreshDate: String
  var font: Font = .caption
  var body: some View {
    let date = convertTimestamp(date: lastRefreshDate)
    HStack(spacing: 0){
      if(isBeforeToday(date)){
        Text("\(date, style: .date) ")
          .widgetAccentable()
          .font(font)
          .foregroundColor(.gray)
      }
      Text(" \(date, style: .time)")
        .widgetAccentable()
        .font(font)
        .foregroundColor(.gray)
    }
  }
}

// pre-heating button (21 °C), with the result of the last tap:
// green (sent) or red (error) for WidgetHvacFeedback.displayDuration. It can be tapped again after an error.
// The Button keeps the default style and no modifier of its own: with .buttonStyle(.plain), .invalidatableContent()
// and .accessibilityLabel on it, the widget did not see it as interactive and a tap opened the app.
// Round gray pill with the icon only; compact (small widget, car half of the Tempo widgets) is smaller.
struct HvacWidgetButton: View {
  var vin: String
  var feedback: WidgetHvacFeedback?
  var compact: Bool = false

  var body: some View {
    // the pill is drawn by the default button style (gray tint, circle). These are environment values set on a
    // container, not modifiers of the Button itself: those made it non-interactive (see above)
    HStack(spacing: 0) {
      Button(intent: LaunchHVACWidgetIntent(vin: vin)) {
        label
          .foregroundStyle(colour)
          .widgetAccentable()
      }
    }
    .tint(.gray)
    .buttonBorderShape(.circle)
  }

  private var label: some View {
    Image(systemName: icon)
      .font(.system(size: compact ? 12 : 14, weight: .semibold))
  }

  private var icon: String {
    switch feedback?.status {
    case .success: return "checkmark"
    case .error: return "xmark"
    case nil: return "heat.waves.and.fan"
    }
  }

  private var colour: Color {
    switch feedback?.status {
    case .success: return .green
    case .error: return .red
    case nil: return Color.primary
    }
  }
}
