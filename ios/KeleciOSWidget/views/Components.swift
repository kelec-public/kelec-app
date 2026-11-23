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

// pre-heating button (21 °C): round gray pill with the icon only, smaller when compact (small widget, car half of the
// Tempo widgets). The tap asks for a confirmation; it and the result cover the whole widget (HvacFeedbackContainer).
// The Button keeps the default style and no modifier of its own: with .buttonStyle(.plain), .invalidatableContent()
// and .accessibilityLabel on it, the widget did not see it as interactive and a tap opened the app.
struct HvacWidgetButton: View {
  var vin: String
  var compact: Bool = false

  var body: some View {
    // the pill is drawn by the default button style. Tint and shape are environment values set on a container,
    // not modifiers of the Button itself (see above)
    HStack(spacing: 0) {
      Button(intent: LaunchHVACWidgetIntent(vin: vin)) {
        Image(systemName: "heat.waves.and.fan")
          .font(.system(size: compact ? 12 : 14, weight: .semibold))
          .foregroundStyle(Color.primary)
          .widgetAccentable()
      }
    }
    .tint(.gray)
    .buttonBorderShape(.circle)
  }
}

// Home screen widget with a pre-heating button:
// - the confirmation over the whole widget (HvacFeedbackView), until Cancel, Confirm or WidgetHvacFeedback.displayDuration;
// - while the command is sent, the system loading effect on the confirmation (invalidatableContent, on the content
//   and not on the Buttons);
// - then the result over the whole widget (HvacFeedbackView), until OK or WidgetHvacFeedback.displayDuration.
struct HvacFeedbackContainer<Content: View>: View {
  var vin: String?
  var feedback: WidgetHvacFeedback?
  @ViewBuilder var content: Content

  var body: some View {
    if let vin = vin, let feedback = feedback {
      HvacFeedbackView(vin: vin, feedback: feedback)
    } else {
      content
        .invalidatableContent()
    }
  }
}

// confirmation (Cancel / Confirm) or result (OK) of the pre-heating button, the size of the widget
struct HvacFeedbackView: View {
  var vin: String
  var feedback: WidgetHvacFeedback
  @Environment(\.widgetFamily) private var family

  private var small: Bool { family == .systemSmall }

  var body: some View {
    VStack(spacing: 8) {
      Spacer(minLength: 0)
      VStack(spacing: 8) {
        icon
          .font(.system(size: small ? 30 : 36))
          .widgetAccentable()
        Text(title)
          .font(.headline)
          .multilineTextAlignment(.center)
          .lineLimit(2)
          .minimumScaleFactor(0.8)
      }
      // loading effect while ConfirmHVACWidgetIntent sends the command
      .invalidatableContent()
      Spacer(minLength: 0)
      // same rule as HvacWidgetButton: style set on the container, no modifier on the Buttons
      HStack(spacing: 6) {
        if feedback.status == .confirming {
          Button(intent: DismissHvacFeedbackIntent(vin: vin)) {
            buttonLabel("cancel")
          }
          HStack(spacing: 0) {
            Button(intent: ConfirmHVACWidgetIntent(vin: vin)) {
              // the default style fills the pill with a light shade of the tint: the text takes the tint itself
              buttonLabel("confirm")
                .foregroundStyle(Color.blue)
            }
          }
          .tint(.blue)
        } else {
          Button(intent: DismissHvacFeedbackIntent(vin: vin)) {
            buttonLabel("widgetHvacOk")
          }
        }
      }
      .font(small ? .caption.weight(.semibold) : .subheadline.weight(.semibold))
      .foregroundStyle(Color.primary)
      .tint(.gray)
      .buttonBorderShape(.capsule)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .padding()
  }

  @ViewBuilder private var icon: some View {
    switch feedback.status {
    case .confirming:
      Image(systemName: "heat.waves.and.fan")
        .foregroundStyle(Color.primary)
    case .success:
      Image(systemName: "checkmark.circle.fill")
        .foregroundStyle(Color.green)
    case .error:
      Image(systemName: "xmark.circle.fill")
        .foregroundStyle(Color.red)
    }
  }

  private var title: LocalizedStringKey {
    switch feedback.status {
    case .confirming: return "launchPreHeat"
    case .success: return "preHeatLaunched"
    case .error: return "error"
    }
  }

  private func buttonLabel(_ key: LocalizedStringKey) -> some View {
    Text(key)
      .lineLimit(1)
      .minimumScaleFactor(0.7)
      .padding(.horizontal, small ? 0 : 6)
  }
}
