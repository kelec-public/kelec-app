import Foundation

private let appGroup = "group.kelyanselme.MyRenaultPlus"

// File lock cross-process partagé avec l'app via App Group container.
// flock() est bloquant et fonctionne entre processes sur iOS.
struct TokenRefreshLock {
    private let fd: Int32

    static func acquire() -> TokenRefreshLock? {
        guard let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return nil }
        let lockURL = groupURL.appendingPathComponent("token_refresh.lock")
        if !FileManager.default.fileExists(atPath: lockURL.path) {
            FileManager.default.createFile(atPath: lockURL.path, contents: nil)
        }
        let fd = open(lockURL.path, O_RDWR)
        guard fd != -1 else { return nil }
        flock(fd, LOCK_EX)
        return TokenRefreshLock(fd: fd)
    }

    func release() {
        flock(fd, LOCK_UN)
        close(fd)
    }
}
