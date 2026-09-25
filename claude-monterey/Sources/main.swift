// Claude para macOS Monterey: ventana nativa (WKWebView) que carga claude.ai.
// Compilar con ./build.sh (requiere Xcode Command Line Tools).

import Cocoa
import WebKit

let homeURL = URL(string: "https://claude.ai/new")!

// Dominios que se abren dentro de la app (login, pagos, captchas).
// Cualquier otro enlace se abre en el navegador predeterminado.
let internalDomains = [
    "claude.ai", "claude.com", "anthropic.com",
    "google.com", "gstatic.com", "googleusercontent.com", "googleapis.com",
    "apple.com", "stripe.com", "stripe.network",
    "cloudflare.com", "hcaptcha.com", "recaptcha.net",
]

func isInternal(_ url: URL) -> Bool {
    guard let host = url.host?.lowercased() else { return true }
    return internalDomains.contains { host == $0 || host.hasSuffix("." + $0) }
}

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate,
    WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate
{
    var window: NSWindow!
    var webView: WKWebView!
    var popups: [NSWindow] = []

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // sesión persistente
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        // UA de Safari real: algunos logins (Google) rechazan webviews "desconocidos".
        config.applicationNameForUserAgent = "Version/17.6 Safari/605.1.15"

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.allowsMagnification = true

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1200, height: 820),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered, defer: false)
        window.title = "Claude"
        window.minSize = NSSize(width: 480, height: 400)
        window.isReleasedWhenClosed = false
        window.contentView = webView
        if !window.setFrameUsingName("ClaudeMainWindow") { window.center() }
        window.setFrameAutosaveName("ClaudeMainWindow")
        window.makeKeyAndOrderFront(nil)

        webView.load(URLRequest(url: homeURL))
        NSApp.activate(ignoringOtherApps: true)
    }

    // Clic en el Dock con la ventana cerrada: volver a mostrarla.
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag { window.makeKeyAndOrderFront(nil) }
        return true
    }

    // MARK: - Menú

    func buildMenu() {
        let main = NSMenu()
        func submenu(_ title: String) -> NSMenu {
            let item = NSMenuItem()
            let menu = NSMenu(title: title)
            item.submenu = menu
            main.addItem(item)
            return menu
        }
        func add(_ menu: NSMenu, _ title: String, _ action: Selector?, _ key: String,
                 _ mods: NSEvent.ModifierFlags = .command, target: AnyObject? = nil) {
            let item = menu.addItem(withTitle: title, action: action, keyEquivalent: key)
            item.keyEquivalentModifierMask = mods
            item.target = target
        }

        let app = submenu("Claude")
        add(app, "Acerca de Claude", #selector(NSApplication.orderFrontStandardAboutPanel(_:)), "")
        app.addItem(.separator())
        add(app, "Ocultar Claude", #selector(NSApplication.hide(_:)), "h")
        add(app, "Ocultar otros", #selector(NSApplication.hideOtherApplications(_:)), "h", [.command, .option])
        add(app, "Mostrar todo", #selector(NSApplication.unhideAllApplications(_:)), "")
        app.addItem(.separator())
        add(app, "Salir de Claude", #selector(NSApplication.terminate(_:)), "q")

        let file = submenu("Archivo")
        add(file, "Nuevo chat", #selector(newChat), "n", target: self)
        add(file, "Cerrar ventana", #selector(NSWindow.performClose(_:)), "w")

        let edit = submenu("Edición")
        add(edit, "Deshacer", Selector(("undo:")), "z")
        add(edit, "Rehacer", Selector(("redo:")), "z", [.command, .shift])
        edit.addItem(.separator())
        add(edit, "Cortar", #selector(NSText.cut(_:)), "x")
        add(edit, "Copiar", #selector(NSText.copy(_:)), "c")
        add(edit, "Pegar", #selector(NSText.paste(_:)), "v")
        add(edit, "Pegar como texto", #selector(NSTextView.pasteAsPlainText(_:)), "v", [.command, .option, .shift])
        add(edit, "Seleccionar todo", #selector(NSText.selectAll(_:)), "a")

        let view = submenu("Ver")
        add(view, "Recargar", #selector(reload), "r", target: self)
        add(view, "Atrás", #selector(goBack), "[", target: self)
        add(view, "Adelante", #selector(goForward), "]", target: self)
        view.addItem(.separator())
        add(view, "Aumentar", #selector(zoomIn), "=", target: self)
        add(view, "Reducir", #selector(zoomOut), "-", target: self)
        add(view, "Tamaño real", #selector(zoomReset), "0", target: self)
        view.addItem(.separator())
        add(view, "Pantalla completa", #selector(NSWindow.toggleFullScreen(_:)), "f", [.command, .control])

        let win = submenu("Ventana")
        add(win, "Minimizar", #selector(NSWindow.performMiniaturize(_:)), "m")
        add(win, "Zoom", #selector(NSWindow.performZoom(_:)), "")
        NSApp.windowsMenu = win

        NSApp.mainMenu = main
    }

    @objc func newChat() { window.makeKeyAndOrderFront(nil); webView.load(URLRequest(url: homeURL)) }
    @objc func reload() {
        if webView.url == nil { webView.load(URLRequest(url: homeURL)) } else { webView.reload() }
    }
    @objc func goBack() { webView.goBack() }
    @objc func goForward() { webView.goForward() }
    @objc func zoomIn() { webView.pageZoom = min(webView.pageZoom + 0.1, 3) }
    @objc func zoomOut() { webView.pageZoom = max(webView.pageZoom - 0.1, 0.5) }
    @objc func zoomReset() { webView.pageZoom = 1 }

    // MARK: - Navegación

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.shouldPerformDownload { return decisionHandler(.download) }
        if let url = navigationAction.request.url {
            let scheme = url.scheme?.lowercased() ?? ""
            if !["http", "https", "about", "blob", "data"].contains(scheme) {
                NSWorkspace.shared.open(url) // mailto:, etc.
                return decisionHandler(.cancel)
            }
            if navigationAction.navigationType == .linkActivated, webView === self.webView, !isInternal(url) {
                NSWorkspace.shared.open(url)
                return decisionHandler(.cancel)
            }
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        decisionHandler(navigationResponse.canShowMIMEType ? .allow : .download)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        let e = error as NSError
        guard webView === self.webView, e.domain == NSURLErrorDomain, e.code != NSURLErrorCancelled else { return }
        webView.loadHTMLString("""
            <body style="font:15px -apple-system;text-align:center;padding-top:30vh;color:#555">
            <h2>Sin conexión</h2><p>\(e.localizedDescription)</p>
            <p><a href="\(homeURL.absoluteString)">Reintentar</a> (⌘R)</p></body>
            """, baseURL: nil)
    }

    // Ventanas emergentes (login con Google/Apple). Enlaces externos → navegador.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, url.scheme?.hasPrefix("http") == true, !isInternal(url) {
            NSWorkspace.shared.open(url)
            return nil
        }
        let popup = WKWebView(frame: NSRect(x: 0, y: 0, width: 520, height: 700), configuration: configuration)
        popup.navigationDelegate = self
        popup.uiDelegate = self
        let w = NSWindow(contentRect: popup.frame, styleMask: [.titled, .closable, .resizable],
                         backing: .buffered, defer: false)
        w.isReleasedWhenClosed = false
        w.contentView = popup
        w.delegate = self
        w.center()
        w.makeKeyAndOrderFront(nil)
        popups.append(w)
        return popup
    }

    func webViewDidClose(_ webView: WKWebView) {
        if let w = webView.window, w !== window { w.close() }
    }

    func windowWillClose(_ notification: Notification) {
        if let w = notification.object as? NSWindow { popups.removeAll { $0 === w } }
    }

    // MARK: - Archivos, micrófono y diálogos JS

    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = parameters.allowsMultipleSelection
        panel.canChooseDirectories = parameters.allowsDirectories
        panel.canChooseFiles = true
        panel.begin { completionHandler($0 == .OK ? panel.urls : nil) }
    }

    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(origin.host == "claude.ai" || origin.host.hasSuffix(".claude.ai") ? .grant : .prompt)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = message
        alert.runModal()
        completionHandler()
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = message
        alert.addButton(withTitle: "Aceptar")
        alert.addButton(withTitle: "Cancelar")
        completionHandler(alert.runModal() == .alertFirstButtonReturn)
    }

    // MARK: - Descargas (a ~/Descargas)

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        download.delegate = self
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        download.delegate = self
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                  suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        let fm = FileManager.default
        let dir = fm.urls(for: .downloadsDirectory, in: .userDomainMask)[0]
        let base = (suggestedFilename as NSString).deletingPathExtension
        let ext = (suggestedFilename as NSString).pathExtension
        var dest = dir.appendingPathComponent(suggestedFilename)
        var i = 1
        while fm.fileExists(atPath: dest.path) {
            dest = dir.appendingPathComponent(ext.isEmpty ? "\(base) (\(i))" : "\(base) (\(i)).\(ext)")
            i += 1
        }
        completionHandler(dest)
    }

    func downloadDidFinish(_ download: WKDownload) {
        NSApp.requestUserAttention(.informationalRequest)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
