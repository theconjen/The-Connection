const { withDangerousMod, withInfoPlist, withAppBuildGradle, withMainApplication, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to add JW Player SDK and Mux Stats integration for iOS AND Android
 *
 * This plugin:
 * 1. iOS: Adds CocoaPods and Swift native view manager with ad support
 * 2. Android: Adds Gradle dependencies and Kotlin native view manager with ad support
 */

// ============================================================================
// iOS Configuration
// ============================================================================

const MUX_JWPLAYER_POD = "pod 'Mux-Stats-JWPlayer', '~> 0.3'";
const JWPLAYER_POD = "pod 'JWPlayerKit', '~> 4.0'";

const withMuxJWPlayerPods = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const podfilePath = path.join(platformRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let contents = fs.readFileSync(podfilePath, 'utf-8');

        if (!contents.includes('Mux-Stats-JWPlayer')) {
          const targetMatch = contents.match(/target\s+['"][^'"]+['"]\s+do/);
          if (targetMatch) {
            const insertPosition = contents.indexOf(targetMatch[0]) + targetMatch[0].length;
            const podsToAdd = `
  # JW Player with Mux Stats
  ${JWPLAYER_POD}
  ${MUX_JWPLAYER_POD}
`;
            contents = contents.slice(0, insertPosition) + podsToAdd + contents.slice(insertPosition);
            fs.writeFileSync(podfilePath, contents, 'utf-8');
            console.info('[withMuxJWPlayer] Added JW Player and Mux Stats pods to Podfile');
          }
        } else {
          console.info('[withMuxJWPlayer] Mux-Stats-JWPlayer pod already present');
        }
      }

      return config;
    },
  ]);
};

const withMuxJWPlayerIOSNativeModule = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName || 'TheConnection';

      const moduleDir = path.join(platformRoot, projectName, 'MuxJWPlayer');
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

      // Create the Swift native module
      const swiftModulePath = path.join(moduleDir, 'MuxJWPlayerModule.swift');
      const swiftContent = `//
//  MuxJWPlayerModule.swift
//  TheConnection
//
//  Native module for JW Player with Mux Stats integration

import Foundation
import React
import JWPlayerKit
import MuxStatsJWPlayer

@objc(MuxJWPlayerModule)
class MuxJWPlayerModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  private var players: [String: JWPlayerViewController] = [:]

  @objc
  func initializePlayer(
    _ playerId: String,
    config: NSDictionary,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      do {
        guard let hlsUrl = config["hlsUrl"] as? String,
              let url = URL(string: hlsUrl) else {
          rejecter("INVALID_CONFIG", "Invalid HLS URL", nil)
          return
        }

        let item = try JWPlayerItemBuilder()
          .file(url)
          .build()

        let playerConfig = try JWPlayerConfigurationBuilder()
          .playlist([item])
          .autostart(config["autostart"] as? Bool ?? false)
          .build()

        let playerVC = JWPlayerViewController()
        playerVC.player.configurePlayer(with: playerConfig)

        if let muxEnvKey = config["muxEnvKey"] as? String {
          let playerData = MUXSDKCustomerPlayerData(environmentKey: muxEnvKey)
          playerData?.playerName = "JW Player iOS"
          playerData?.playerVersion = "4.0"

          if let viewerUserId = config["viewerUserId"] as? String {
            playerData?.viewerUserId = viewerUserId
          }

          let videoData = MUXSDKCustomerVideoData()
          videoData.videoId = config["videoId"] as? String
          videoData.videoTitle = config["videoTitle"] as? String
          videoData.videoSeries = config["videoSeries"] as? String

          if let duration = config["videoDuration"] as? Int {
            videoData.videoDuration = NSNumber(value: duration)
          }
          videoData.videoIsLive = NSNumber(value: false)

          MUXSDKStatsJWPlayer.monitorJWPlayerController(
            playerVC,
            name: playerId,
            playerData: playerData!,
            videoData: videoData
          )
        }

        self.players[playerId] = playerVC
        resolver(["success": true, "playerId": playerId])
      } catch {
        rejecter("PLAYER_ERROR", "Failed to initialize player: \\(error.localizedDescription)", error)
      }
    }
  }

  @objc
  func play(_ playerId: String) {
    DispatchQueue.main.async {
      self.players[playerId]?.player.play()
    }
  }

  @objc
  func pause(_ playerId: String) {
    DispatchQueue.main.async {
      self.players[playerId]?.player.pause()
    }
  }

  @objc
  func stop(_ playerId: String) {
    DispatchQueue.main.async {
      self.players[playerId]?.player.stop()
    }
  }

  @objc
  func destroyPlayer(_ playerId: String) {
    DispatchQueue.main.async {
      if let player = self.players[playerId] {
        MUXSDKStatsJWPlayer.destroyPlayer(name: playerId)
        self.players.removeValue(forKey: playerId)
      }
    }
  }
}
`;
      fs.writeFileSync(swiftModulePath, swiftContent, 'utf-8');
      console.info('[withMuxJWPlayer] Created MuxJWPlayerModule.swift');

      // Create the Objective-C bridge
      const bridgePath = path.join(moduleDir, 'MuxJWPlayerModule.m');
      const bridgeContent = `//
//  MuxJWPlayerModule.m
//  TheConnection
//
//  Objective-C bridge for MuxJWPlayerModule

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MuxJWPlayerModule, NSObject)

RCT_EXTERN_METHOD(initializePlayer:(NSString *)playerId
                  config:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(play:(NSString *)playerId)

RCT_EXTERN_METHOD(pause:(NSString *)playerId)

RCT_EXTERN_METHOD(stop:(NSString *)playerId)

RCT_EXTERN_METHOD(destroyPlayer:(NSString *)playerId)

@end
`;
      fs.writeFileSync(bridgePath, bridgeContent, 'utf-8');
      console.info('[withMuxJWPlayer] Created MuxJWPlayerModule.m');

      // Create the React Native View wrapper with CSAI ad support
      const viewPath = path.join(moduleDir, 'MuxJWPlayerView.swift');
      const viewContent = `//
//  MuxJWPlayerView.swift
//  TheConnection
//
//  Native JW Player view component with CSAI ad support

import Foundation
import UIKit
import React
import JWPlayerKit
import MuxStatsJWPlayer

class MuxJWPlayerView: UIView {

  private var playerVC: JWPlayerViewController?
  private var playerId: String?

  @objc var hlsUrl: String = "" {
    didSet { setupPlayer() }
  }

  @objc var posterUrl: String = ""

  @objc var autostart: Bool = false

  @objc var muxEnvKey: String = ""

  @objc var videoId: String = ""

  @objc var videoTitle: String = ""

  @objc var videoSeries: String = ""

  @objc var videoDuration: Int = 0

  @objc var viewerUserId: String = ""

  @objc var adTagUrl: String = "" // CSAI ad tag URL

  @objc var onPlayerReady: RCTDirectEventBlock?

  @objc var onPlayerError: RCTDirectEventBlock?

  @objc var onPlaybackStateChange: RCTDirectEventBlock?

  @objc var onAdEvent: RCTDirectEventBlock?

  override init(frame: CGRect) {
    super.init(frame: frame)
    self.playerId = UUID().uuidString
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setupPlayer() {
    guard !hlsUrl.isEmpty, let url = URL(string: hlsUrl) else { return }

    playerVC?.view.removeFromSuperview()
    playerVC?.removeFromParent()

    do {
      // Create player item
      var itemBuilder = try JWPlayerItemBuilder().file(url)

      if !posterUrl.isEmpty, let poster = URL(string: posterUrl) {
        itemBuilder = itemBuilder.posterImage(poster)
      }

      let item = try itemBuilder.build()

      // Create config builder
      var configBuilder = try JWPlayerConfigurationBuilder()
        .playlist([item])
        .autostart(autostart)

      // Add CSAI advertising if adTagUrl is provided
      if !adTagUrl.isEmpty, let adUrl = URL(string: adTagUrl) {
        let adConfig = try JWAdvertisingConfigBuilder()
          .schedule([
            JWAdBreakBuilder()
              .offset(.pre)
              .tags([adUrl])
              .build()
          ])
          .build()
        configBuilder = configBuilder.advertising(adConfig)
      }

      let playerConfig = try configBuilder.build()

      // Create player
      let vc = JWPlayerViewController()
      vc.player.configurePlayer(with: playerConfig)
      vc.player.delegate = self

      // Add ad delegate for ad events
      vc.player.adDelegate = self

      // Add player view
      vc.view.frame = bounds
      vc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      addSubview(vc.view)

      playerVC = vc

      // Initialize Mux Stats
      if !muxEnvKey.isEmpty, let id = playerId {
        let playerData = MUXSDKCustomerPlayerData(environmentKey: muxEnvKey)
        playerData?.playerName = "JW Player iOS"
        playerData?.playerVersion = "4.0"

        if !viewerUserId.isEmpty {
          playerData?.viewerUserId = viewerUserId
        }

        let videoData = MUXSDKCustomerVideoData()
        if !videoId.isEmpty { videoData.videoId = videoId }
        if !videoTitle.isEmpty { videoData.videoTitle = videoTitle }
        if !videoSeries.isEmpty { videoData.videoSeries = videoSeries }
        if videoDuration > 0 { videoData.videoDuration = NSNumber(value: videoDuration) }
        videoData.videoIsLive = NSNumber(value: false)

        MUXSDKStatsJWPlayer.monitorJWPlayerController(
          vc,
          name: id,
          playerData: playerData!,
          videoData: videoData
        )
      }

      onPlayerReady?(["playerId": playerId ?? ""])
    } catch {
      onPlayerError?(["error": error.localizedDescription])
    }
  }

  override func removeFromSuperview() {
    if let id = playerId {
      MUXSDKStatsJWPlayer.destroyPlayer(name: id)
    }
    playerVC?.view.removeFromSuperview()
    playerVC?.removeFromParent()
    super.removeFromSuperview()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    playerVC?.view.frame = bounds
  }
}

extension MuxJWPlayerView: JWPlayerDelegate {
  func jwplayerIsReady(_ player: JWPlayer) {
    onPlayerReady?(["playerId": playerId ?? ""])
  }

  func jwplayer(_ player: JWPlayer, failedWithError code: UInt, message: String) {
    onPlayerError?(["error": message, "code": code])
  }

  func jwplayer(_ player: JWPlayer, isPlayingWithReason reason: JWPlayReason) {
    onPlaybackStateChange?(["state": "playing"])
  }

  func jwplayer(_ player: JWPlayer, didPauseWithReason reason: JWPauseReason) {
    onPlaybackStateChange?(["state": "paused"])
  }

  func jwplayer(_ player: JWPlayer, didFinishPlaylistWithReason reason: JWCompleteReason) {
    onPlaybackStateChange?(["state": "complete"])
  }

  func jwplayer(_ player: JWPlayer, isBufferingWithReason reason: JWBufferReason) {
    onPlaybackStateChange?(["state": "buffering"])
  }
}

// CSAI Ad delegate
extension MuxJWPlayerView: JWAdDelegate {
  func jwplayer(_ player: JWPlayer, adEvent event: JWAdEvent) {
    var eventName = "unknown"
    switch event.type {
    case .impression:
      eventName = "impression"
    case .started:
      eventName = "started"
    case .complete:
      eventName = "complete"
    case .clicked:
      eventName = "clicked"
    case .skipped:
      eventName = "skipped"
    default:
      break
    }
    onAdEvent?(["event": eventName])
  }
}
`;
      fs.writeFileSync(viewPath, viewContent, 'utf-8');
      console.info('[withMuxJWPlayer] Created MuxJWPlayerView.swift with CSAI support');

      // Create the View Manager
      const viewManagerPath = path.join(moduleDir, 'MuxJWPlayerViewManager.swift');
      const viewManagerContent = `//
//  MuxJWPlayerViewManager.swift
//  TheConnection
//
//  React Native view manager for JW Player

import Foundation
import React

@objc(MuxJWPlayerViewManager)
class MuxJWPlayerViewManager: RCTViewManager {

  override func view() -> UIView! {
    return MuxJWPlayerView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
`;
      fs.writeFileSync(viewManagerPath, viewManagerContent, 'utf-8');
      console.info('[withMuxJWPlayer] Created MuxJWPlayerViewManager.swift');

      // Create the View Manager bridge with adTagUrl
      const viewManagerBridgePath = path.join(moduleDir, 'MuxJWPlayerViewManager.m');
      const viewManagerBridgeContent = `//
//  MuxJWPlayerViewManager.m
//  TheConnection
//
//  Objective-C bridge for MuxJWPlayerViewManager

#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(MuxJWPlayerViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(hlsUrl, NSString)
RCT_EXPORT_VIEW_PROPERTY(posterUrl, NSString)
RCT_EXPORT_VIEW_PROPERTY(autostart, BOOL)
RCT_EXPORT_VIEW_PROPERTY(muxEnvKey, NSString)
RCT_EXPORT_VIEW_PROPERTY(videoId, NSString)
RCT_EXPORT_VIEW_PROPERTY(videoTitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(videoSeries, NSString)
RCT_EXPORT_VIEW_PROPERTY(videoDuration, int)
RCT_EXPORT_VIEW_PROPERTY(viewerUserId, NSString)
RCT_EXPORT_VIEW_PROPERTY(adTagUrl, NSString)
RCT_EXPORT_VIEW_PROPERTY(onPlayerReady, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayerError, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlaybackStateChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAdEvent, RCTDirectEventBlock)

@end
`;
      fs.writeFileSync(viewManagerBridgePath, viewManagerBridgeContent, 'utf-8');
      console.info('[withMuxJWPlayer] Created MuxJWPlayerViewManager.m with adTagUrl');

      return config;
    },
  ]);
};

// ============================================================================
// Android Configuration
// ============================================================================

const withMuxJWPlayerAndroidGradle = (config) => {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Add JW Player and Mux Stats dependencies
    if (!contents.includes('com.jwplayer:jwplayer-core')) {
      // Find dependencies block
      const depsMatch = contents.match(/dependencies\s*\{/);
      if (depsMatch) {
        const insertPosition = contents.indexOf(depsMatch[0]) + depsMatch[0].length;
        const depsToAdd = `
    // JW Player with Mux Stats
    implementation 'com.jwplayer:jwplayer-core:4.18.1'
    implementation 'com.mux.stats.sdk.muxstats:MuxJWPlayerSDK:0.2.0'
`;
        contents = contents.slice(0, insertPosition) + depsToAdd + contents.slice(insertPosition);
        config.modResults.contents = contents;
        console.info('[withMuxJWPlayer] Added JW Player Android dependencies');
      }
    }

    return config;
  });
};

const withMuxJWPlayerAndroidManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (mainApplication) {
      // Add JW Player license key meta-data placeholder
      // Note: License key should be added via environment variable or secrets
      if (!mainApplication['meta-data']) {
        mainApplication['meta-data'] = [];
      }

      const hasJWLicenseKey = mainApplication['meta-data'].some(
        (meta) => meta.$?.['android:name'] === 'JW_LICENSE_KEY'
      );

      if (!hasJWLicenseKey) {
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'JW_LICENSE_KEY',
            'android:value': '${JW_PLAYER_LICENSE_KEY}',
          },
        });
        console.info('[withMuxJWPlayer] Added JW Player license key placeholder to AndroidManifest');
      }
    }

    return config;
  });
};

const withMuxJWPlayerAndroidNativeModule = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const packageName = config.android?.package || 'app.theconnection.mobile';
      const packagePath = packageName.replace(/\./g, '/');

      // Create the native module directory
      const moduleDir = path.join(platformRoot, 'app/src/main/java', packagePath, 'jwplayer');
      if (!fs.existsSync(moduleDir)) {
        fs.mkdirSync(moduleDir, { recursive: true });
      }

      // Create MuxJWPlayerView.kt
      const viewPath = path.join(moduleDir, 'MuxJWPlayerView.kt');
      const viewContent = `package ${packageName}.jwplayer

import android.content.Context
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.jwplayer.pub.api.JWPlayer
import com.jwplayer.pub.api.configuration.PlayerConfig
import com.jwplayer.pub.api.configuration.ads.advertising.AdvertisingConfig
import com.jwplayer.pub.api.configuration.ads.advertising.ImaVMAPAdvertisingConfig
import com.jwplayer.pub.api.events.*
import com.jwplayer.pub.api.events.listeners.AdEventsListener
import com.jwplayer.pub.api.events.listeners.VideoPlayerEventsListener
import com.jwplayer.pub.api.media.playlists.PlaylistItem
import com.jwplayer.pub.view.JWPlayerView
import com.mux.stats.sdk.muxstats.MuxStatsJWPlayer
import com.mux.stats.sdk.core.model.CustomerPlayerData
import com.mux.stats.sdk.core.model.CustomerVideoData

class MuxJWPlayerView(context: Context) : FrameLayout(context) {

    private var playerView: JWPlayerView? = null
    private var player: JWPlayer? = null
    private var muxStats: MuxStatsJWPlayer? = null
    private var playerId: String = java.util.UUID.randomUUID().toString()

    var hlsUrl: String = ""
        set(value) {
            field = value
            setupPlayer()
        }

    var posterUrl: String = ""
    var autostart: Boolean = false
    var muxEnvKey: String = ""
    var videoId: String = ""
    var videoTitle: String = ""
    var videoSeries: String = ""
    var videoDuration: Int = 0
    var viewerUserId: String = ""
    var adTagUrl: String = "" // CSAI ad tag URL

    init {
        playerView = JWPlayerView(context)
        addView(playerView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    private fun setupPlayer() {
        if (hlsUrl.isEmpty()) return

        val playlistItem = PlaylistItem.Builder()
            .file(hlsUrl)
            .apply {
                if (posterUrl.isNotEmpty()) {
                    image(posterUrl)
                }
            }
            .build()

        val configBuilder = PlayerConfig.Builder()
            .playlist(listOf(playlistItem))
            .autostart(autostart)

        // Add CSAI advertising if adTagUrl is provided
        if (adTagUrl.isNotEmpty()) {
            val adConfig = ImaVMAPAdvertisingConfig.Builder()
                .vmapURL(adTagUrl)
                .build()
            configBuilder.advertisingConfig(adConfig)
        }

        val config = configBuilder.build()

        playerView?.let { pv ->
            player = pv.getPlayer(context)
            player?.setup(config)

            // Add playback event listeners
            player?.addListener(EventType.READY, object : VideoPlayerEventsListener {
                override fun onReady(event: ReadyEvent) {
                    sendEvent("onPlayerReady", Arguments.createMap().apply {
                        putString("playerId", playerId)
                    })
                }
            })

            player?.addListener(EventType.PLAY, object : VideoPlayerEventsListener {
                override fun onPlay(event: PlayEvent) {
                    sendEvent("onPlaybackStateChange", Arguments.createMap().apply {
                        putString("state", "playing")
                    })
                }
            })

            player?.addListener(EventType.PAUSE, object : VideoPlayerEventsListener {
                override fun onPause(event: PauseEvent) {
                    sendEvent("onPlaybackStateChange", Arguments.createMap().apply {
                        putString("state", "paused")
                    })
                }
            })

            player?.addListener(EventType.COMPLETE, object : VideoPlayerEventsListener {
                override fun onComplete(event: CompleteEvent) {
                    sendEvent("onPlaybackStateChange", Arguments.createMap().apply {
                        putString("state", "complete")
                    })
                }
            })

            player?.addListener(EventType.BUFFER, object : VideoPlayerEventsListener {
                override fun onBuffer(event: BufferEvent) {
                    sendEvent("onPlaybackStateChange", Arguments.createMap().apply {
                        putString("state", "buffering")
                    })
                }
            })

            player?.addListener(EventType.ERROR, object : VideoPlayerEventsListener {
                override fun onError(event: ErrorEvent) {
                    sendEvent("onPlayerError", Arguments.createMap().apply {
                        putString("error", event.message)
                    })
                }
            })

            // Add ad event listeners
            player?.addListener(EventType.AD_IMPRESSION, object : AdEventsListener {
                override fun onAdImpression(event: AdImpressionEvent) {
                    sendEvent("onAdEvent", Arguments.createMap().apply {
                        putString("event", "impression")
                    })
                }
            })

            player?.addListener(EventType.AD_STARTED, object : AdEventsListener {
                override fun onAdStarted(event: AdStartedEvent) {
                    sendEvent("onAdEvent", Arguments.createMap().apply {
                        putString("event", "started")
                    })
                }
            })

            player?.addListener(EventType.AD_COMPLETE, object : AdEventsListener {
                override fun onAdComplete(event: AdCompleteEvent) {
                    sendEvent("onAdEvent", Arguments.createMap().apply {
                        putString("event", "complete")
                    })
                }
            })

            // Initialize Mux Stats
            if (muxEnvKey.isNotEmpty()) {
                val playerData = CustomerPlayerData().apply {
                    environmentKey = muxEnvKey
                    playerName = "JW Player Android"
                    playerVersion = "4.18.1"
                    if (viewerUserId.isNotEmpty()) {
                        this.viewerUserId = viewerUserId
                    }
                }

                val videoData = CustomerVideoData().apply {
                    if (this@MuxJWPlayerView.videoId.isNotEmpty()) this.videoId = this@MuxJWPlayerView.videoId
                    if (videoTitle.isNotEmpty()) this.videoTitle = videoTitle
                    if (videoSeries.isNotEmpty()) this.videoSeries = videoSeries
                    if (videoDuration > 0) this.videoDuration = videoDuration.toLong()
                    this.videoIsLive = false
                }

                muxStats = MuxStatsJWPlayer(context, player!!, playerId, playerData, videoData)
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        val reactContext = context as? ReactContext ?: return
        reactContext.getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, eventName, params)
    }

    fun onDestroy() {
        muxStats?.release()
        player?.stop()
        player = null
        playerView = null
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        onDestroy()
    }
}
`;
      fs.writeFileSync(viewPath, viewContent, 'utf-8');
      console.info('[withMuxJWPlayer] Created MuxJWPlayerView.kt');

      // Create MuxJWPlayerViewManager.kt
      const viewManagerPath = path.join(moduleDir, 'MuxJWPlayerViewManager.kt');
      const viewManagerContent = `package ${packageName}.jwplayer

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class MuxJWPlayerViewManager(reactContext: ReactApplicationContext) : SimpleViewManager<MuxJWPlayerView>() {

    override fun getName() = "MuxJWPlayerView"

    override fun createViewInstance(reactContext: ThemedReactContext): MuxJWPlayerView {
        return MuxJWPlayerView(reactContext)
    }

    @ReactProp(name = "hlsUrl")
    fun setHlsUrl(view: MuxJWPlayerView, url: String) {
        view.hlsUrl = url
    }

    @ReactProp(name = "posterUrl")
    fun setPosterUrl(view: MuxJWPlayerView, url: String) {
        view.posterUrl = url
    }

    @ReactProp(name = "autostart")
    fun setAutostart(view: MuxJWPlayerView, autostart: Boolean) {
        view.autostart = autostart
    }

    @ReactProp(name = "muxEnvKey")
    fun setMuxEnvKey(view: MuxJWPlayerView, key: String) {
        view.muxEnvKey = key
    }

    @ReactProp(name = "videoId")
    fun setVideoId(view: MuxJWPlayerView, videoId: String) {
        view.videoId = videoId
    }

    @ReactProp(name = "videoTitle")
    fun setVideoTitle(view: MuxJWPlayerView, title: String) {
        view.videoTitle = title
    }

    @ReactProp(name = "videoSeries")
    fun setVideoSeries(view: MuxJWPlayerView, series: String) {
        view.videoSeries = series
    }

    @ReactProp(name = "videoDuration")
    fun setVideoDuration(view: MuxJWPlayerView, duration: Int) {
        view.videoDuration = duration
    }

    @ReactProp(name = "viewerUserId")
    fun setViewerUserId(view: MuxJWPlayerView, userId: String) {
        view.viewerUserId = userId
    }

    @ReactProp(name = "adTagUrl")
    fun setAdTagUrl(view: MuxJWPlayerView, adTagUrl: String) {
        view.adTagUrl = adTagUrl
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
        return MapBuilder.builder<String, Any>()
            .put("onPlayerReady", MapBuilder.of("registrationName", "onPlayerReady"))
            .put("onPlayerError", MapBuilder.of("registrationName", "onPlayerError"))
            .put("onPlaybackStateChange", MapBuilder.of("registrationName", "onPlaybackStateChange"))
            .put("onAdEvent", MapBuilder.of("registrationName", "onAdEvent"))
            .build()
    }

    override fun onDropViewInstance(view: MuxJWPlayerView) {
        super.onDropViewInstance(view)
        view.onDestroy()
    }
}
`;
      fs.writeFileSync(viewManagerPath, viewManagerContent, 'utf-8');
      console.info('[withMuxJWPlayer] Created MuxJWPlayerViewManager.kt');

      // Create MuxJWPlayerPackage.kt
      const packageFilePath = path.join(moduleDir, 'MuxJWPlayerPackage.kt');
      const packageFileContent = `package ${packageName}.jwplayer

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class MuxJWPlayerPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return emptyList()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return listOf(MuxJWPlayerViewManager(reactContext))
    }
}
`;
      fs.writeFileSync(packageFilePath, packageFileContent, 'utf-8');
      console.info('[withMuxJWPlayer] Created MuxJWPlayerPackage.kt');

      return config;
    },
  ]);
};

const withMuxJWPlayerMainApplication = (config) => {
  return withMainApplication(config, (config) => {
    const packageName = config.android?.package || 'app.theconnection.mobile';
    let contents = config.modResults.contents;

    // Add import for the package
    const importStatement = `import ${packageName}.jwplayer.MuxJWPlayerPackage`;
    if (!contents.includes(importStatement)) {
      // Find the package imports section
      const lastImportMatch = contents.match(/^import .+$/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        contents = contents.replace(lastImport, `${lastImport}\n${importStatement}`);
      }
    }

    // Add package to getPackages()
    if (!contents.includes('MuxJWPlayerPackage()')) {
      // Find the packages list in getPackages method
      const packagesMatch = contents.match(/packages\.add\([\s\S]*?\)/);
      if (packagesMatch) {
        // Add before the return statement or at the end of package additions
        const addPackageLine = '      packages.add(MuxJWPlayerPackage())';
        if (!contents.includes(addPackageLine)) {
          // Find a good place to add it
          const returnMatch = contents.match(/return packages/);
          if (returnMatch) {
            contents = contents.replace(
              'return packages',
              `packages.add(MuxJWPlayerPackage())\n      return packages`
            );
          }
        }
      } else {
        // For newer Expo SDK with different structure
        if (contents.includes('PackageList(this).packages')) {
          contents = contents.replace(
            'PackageList(this).packages',
            'PackageList(this).packages.apply { add(MuxJWPlayerPackage()) }'
          );
        }
      }
    }

    config.modResults.contents = contents;
    console.info('[withMuxJWPlayer] Registered MuxJWPlayerPackage in MainApplication');

    return config;
  });
};

// ============================================================================
// Main Plugin Export
// ============================================================================

const withMuxJWPlayer = (config) => {
  // iOS
  config = withMuxJWPlayerPods(config);
  config = withMuxJWPlayerIOSNativeModule(config);

  // Android
  config = withMuxJWPlayerAndroidGradle(config);
  config = withMuxJWPlayerAndroidManifest(config);
  config = withMuxJWPlayerAndroidNativeModule(config);
  config = withMuxJWPlayerMainApplication(config);

  return config;
};

module.exports = withMuxJWPlayer;
