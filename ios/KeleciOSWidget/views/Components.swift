//
//  Components.swift
//  KeleciOSWidgetExtension
//
//  Small views shared by the home screen widgets.
//

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
