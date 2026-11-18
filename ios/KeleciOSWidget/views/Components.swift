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
// Tempo widgets). Its result covers the whole widget (HvacFeedbackContainer).
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
// - while the command is sent, the system loading effect on the whole widget (invalidatableContent, on the content
//   and not on the Button);
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

// result of the pre-heating button, the size of the widget, with OK
struct HvacFeedbackView: View {
  var vin: String
  var feedback: WidgetHvacFeedback
  @Environment(\.widgetFamily) private var family

  private var success: Bool { feedback.status == .success }
  private var small: Bool { family == .systemSmall }

  var body: some View {
    VStack(spacing: 8) {
      Spacer(minLength: 0)
      Image(systemName: success ? "checkmark.circle.fill" : "xmark.circle.fill")
        .font(.system(size: small ? 30 : 36))
        .foregroundStyle(success ? Color.green : Color.red)
        .widgetAccentable()
      Text(success ? "preHeatLaunched" : "error")
        .font(.headline)
        .multilineTextAlignment(.center)
        .lineLimit(2)
        .minimumScaleFactor(0.8)
      Spacer(minLength: 0)
      // same rule as HvacWidgetButton: style set on the container, no modifier on the Button
      HStack(spacing: 0) {
        Button(intent: DismissHvacFeedbackIntent(vin: vin)) {
          Text("widgetHvacOk")
            .padding(.horizontal, 6)
        }
      }
      .font(.subheadline.weight(.semibold))
      .foregroundStyle(Color.primary)
      .tint(.gray)
      .buttonBorderShape(.capsule)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .padding()
  }
}
