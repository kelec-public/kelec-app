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
// dimmed while the command is sent, then green (sent) or red (error) for WidgetHvacFeedback.displayDuration.
// It can be tapped again after an error.
// - full (medium widgets): icon and "21°C" ("Error" after a failure);
// - compact (small widget, car half of the Tempo widgets): round pill with the icon only.
struct HvacWidgetButton: View {
  var vin: String
  var feedback: WidgetHvacFeedback?
  var compact: Bool = false

  var body: some View {
    Button(intent: LaunchHVACWidgetIntent(vin: vin)) {
      label
        .foregroundColor(colour)
        .widgetAccentable()
        // dimmed by WidgetKit while the intent runs
        .invalidatableContent()
    }
    .buttonStyle(.plain)
    .accessibilityLabel(Text(feedback?.status == .success ? "preHeatLaunched" : "launchPreHeat"))
  }

  @ViewBuilder
  private var label: some View {
    if compact {
      Image(systemName: icon)
        .font(.system(size: 12, weight: .semibold))
        .frame(width: 26, height: 26)
        .background(Circle().fill(Color("gris")))
    } else {
      HStack(spacing: 4) {
        Image(systemName: icon)
        if feedback?.status == .error {
          Text("error")
        } else {
          Text("\(WidgetHvacFeedback.temperature)°C")
        }
      }
      .font(.caption)
      .fontWeight(.semibold)
      .padding(.horizontal, 10)
      .padding(.vertical, 5)
      .background(Capsule().fill(Color("gris")))
    }
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
