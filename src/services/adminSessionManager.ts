import { logoutAdmin, getActiveAdminSession } from './adminAuth';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000; // Warning 2 minutes before

type SessionEventCallback = () => void;
type WarningCallback = (secondsLeft: number) => void;

class SessionManager {
  private lastActivity: number = Date.now();
  private checkInterval: any = null;
  private warningShown: boolean = false;
  private onWarningListeners: Set<WarningCallback> = new Set();
  private onExpiredListeners: Set<SessionEventCallback> = new Set();

  constructor() {
    this.handleUserActivity = this.handleUserActivity.bind(this);
    this.checkSessionHealth = this.checkSessionHealth.bind(this);
  }

  public start() {
    this.lastActivity = Date.now();
    this.warningShown = false;

    // Attach activity listeners to reset idle timer
    window.addEventListener('mousemove', this.handleUserActivity, { passive: true });
    window.addEventListener('mousedown', this.handleUserActivity, { passive: true });
    window.addEventListener('keydown', this.handleUserActivity, { passive: true });
    window.addEventListener('touchstart', this.handleUserActivity, { passive: true });

    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(this.checkSessionHealth, 5000);
  }

  public stop() {
    window.removeEventListener('mousemove', this.handleUserActivity);
    window.removeEventListener('mousedown', this.handleUserActivity);
    window.removeEventListener('keydown', this.handleUserActivity);
    window.removeEventListener('touchstart', this.handleUserActivity);

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public handleUserActivity() {
    const now = Date.now();
    // Throttle activity updates to once per 5 seconds
    if (now - this.lastActivity > 5000) {
      this.lastActivity = now;
      if (this.warningShown) {
        this.warningShown = false;
      }
    }
  }

  public extendSession() {
    this.lastActivity = Date.now();
    this.warningShown = false;
  }

  public async checkSessionHealth() {
    const session = await getActiveAdminSession();
    if (!session) {
      return;
    }

    const now = Date.now();
    const idleTime = now - this.lastActivity;

    // 1. Session completely expired due to inactivity
    if (idleTime >= INACTIVITY_TIMEOUT_MS) {
      this.stop();
      await logoutAdmin();
      this.onExpiredListeners.forEach((cb) => cb());
      return;
    }

    // 2. Warning period
    const timeLeft = INACTIVITY_TIMEOUT_MS - idleTime;
    if (timeLeft <= WARNING_BEFORE_TIMEOUT_MS) {
      this.warningShown = true;
      const secondsLeft = Math.ceil(timeLeft / 1000);
      this.onWarningListeners.forEach((cb) => cb(secondsLeft));
    }
  }

  public onWarning(cb: WarningCallback): () => void {
    this.onWarningListeners.add(cb);
    return () => this.onWarningListeners.delete(cb);
  }

  public onExpired(cb: SessionEventCallback): () => void {
    this.onExpiredListeners.add(cb);
    return () => this.onExpiredListeners.delete(cb);
  }
}

export const adminSessionManager = new SessionManager();
