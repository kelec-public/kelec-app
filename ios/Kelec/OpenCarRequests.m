//
//  OpenCarRequests.m
//  Kelec
//
//  Exposes the Swift module OpenCarRequests (OpenCarRequests.swift) to React Native.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(OpenCarRequests, RCTEventEmitter)

RCT_EXTERN_METHOD(consume:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
