import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    private let privacyView = UIView()

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        privacyView.backgroundColor = UIColor(red: 10 / 255, green: 10 / 255, blue: 9 / 255, alpha: 1)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(captureStateChanged),
            name: UIScreen.capturedDidChangeNotification,
            object: nil
        )
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        showPrivacyView()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        captureStateChanged()
    }

    @objc private func captureStateChanged() {
        UIScreen.main.isCaptured ? showPrivacyView() : hidePrivacyView()
    }

    private func showPrivacyView() {
        guard let window else { return }
        privacyView.frame = window.bounds
        privacyView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        if privacyView.superview == nil { window.addSubview(privacyView) }
    }

    private func hidePrivacyView() {
        privacyView.removeFromSuperview()
    }
}
