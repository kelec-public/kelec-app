//
//  KelecWatchOSWidget.swift
//  KelecWatchOSWidgetsExtension
//
//  Created by Kelyan Pegeot-Selme on 28/06/2024.
//

import Foundation
import SwiftUI
import renaultApi
import WidgetKit


struct Provider: TimelineProvider {
  
  func placeholder(in context: Context) -> SimpleEntry {
    SimpleEntry.preview
  }
  
  func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
    completion(SimpleEntry.preview)
  }
  
  func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ())   {
    Task{
      let currentDate = Date()
      let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
      let data = await VehicleLoader.loadWidgetData(selectCar: watchCar)
      let entry = SimpleEntry(date: currentDate, account: data.account, userCar: data.userCar, carName: data.carName,  appPreferences: data.appPreferences, apiHandler: data.apiHandler)
      completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
  }
}

struct SimpleEntry: TimelineEntry {
  let date: Date
  let account: UserAccount?
  let userCar: UserCar?
  let carName: String
  let appPreferences: AppPreferences?
  let apiHandler: ApiHandler?
}

extension SimpleEntry {
  static var preview: SimpleEntry {
    SimpleEntry(date: Date(), account: PreviewData.account, userCar: PreviewData.userCar, carName: PreviewData.carName, appPreferences: nil, apiHandler: PreviewData.apiHandler)
  }
}

struct KelecWatchOSWidgetEntryView : View {
  var alternative: Int = 0
  var entry: Provider.Entry
  @Environment(\.widgetFamily) var family
  var body: some View{
    if #available(iOSApplicationExtension 16.0, *) {
      switch family{
      case .accessoryCircular:
        KelecLockScreenCircularView(apiHandler: entry.apiHandler, alternative: alternative)
          .widgetBackground()
      case .accessoryInline:
        CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler) { _, _, apiHandler in
          KelecLockScreenInlineView(apiHandler: apiHandler)
        }
      case .accessoryRectangular:
        CarWidgetStateView(account: entry.account, userCar: entry.userCar, apiHandler: entry.apiHandler) { _, _, apiHandler in
          KelecLockScreenRectangularView(apiHandler: apiHandler, carName: entry.carName, appPreferences: entry.appPreferences)
            .widgetBackground()
        }
          case .accessoryCorner:
        Text("\(entry.apiHandler?.getBatteryLevel() ?? 0)%")
                        .widgetLabel {
                            ProgressView(value: Double(entry.apiHandler?.getBatteryLevel() ?? 0), total: 100)
                                .tint(.accentColor)
                                .widgetAccentable()
                        }
                        .backport.widgetCurvesContent()

          default:
              Gauge(value: 0 , in: 0...100) {
                  Image(systemName:  "car.fill")
              }currentValueLabel: {
                  Text("XX")
              }
              .gaugeStyle(.accessoryCircular)
              .widgetAccentable()
              .tint(.accentColor)
          }
          
      }else{
          EmptyView()
      }
  }
}

struct KelecWatchOSWidget: Widget {
    let kind: String = "KelecWatchWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            KelecWatchOSWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Renault E-Tech")
        .description("watchWidgetDescription")
        .supportedFamilies([.accessoryCircular, .accessoryInline, .accessoryRectangular, .accessoryCorner])
    }
}

struct KelecWatchOSWidgetAlternative: Widget {
    let kind: String = "KelecWatchWidgetAlternative"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
          KelecWatchOSWidgetEntryView(alternative: 1, entry: entry)
        }
        .configurationDisplayName("Renault E-Tech Alternative")
        .description("watchWidgetDescription")
        .supportedFamilies([.accessoryCircular])
    }
}

public struct Backport<Content> {
  public let content: Content

  public init(_ content: Content) {
    self.content = content
  }
}

extension View {
  var backport: Backport<Self> { Backport(self) }
}

extension Backport where Content: View {
  @ViewBuilder func widgetCurvesContent() -> some View {
    if #available(watchOS 10.0, iOSApplicationExtension 17.0, iOS 17.0, macOSApplicationExtension 14.0, *) {
      content.widgetCurvesContent()

    } else {
      content
    }
  }
  // You can put multiple funcs in here
}
