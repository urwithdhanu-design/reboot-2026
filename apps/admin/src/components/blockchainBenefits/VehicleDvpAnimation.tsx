import { ArrowLeftRight, Banknote, FileBadge } from 'lucide-react';

export function VehicleDvpAnimation() {
  return (
    <div className="bb-vehicle-dvp" aria-label="Animated DvP settlement: security and payment exchange atomically">
      <div className="bb-vehicle-dvp-header">
        <span className="bb-vehicle-dvp-phase bb-vehicle-dvp-phase--before">Before</span>
        <span className="bb-vehicle-dvp-phase bb-vehicle-dvp-phase--during">DvP in motion</span>
        <span className="bb-vehicle-dvp-phase bb-vehicle-dvp-phase--after">After</span>
      </div>

      <div className="bb-vehicle-dvp-stage">
        <div className="bb-vehicle-dvp-party bb-vehicle-dvp-party--a">
          <p className="bb-vehicle-dvp-name">Investor A</p>
          <div className="bb-vehicle-dvp-wallet">
            <div className="bb-vehicle-dvp-slot bb-vehicle-dvp-slot--security-a">
              <FileBadge className="w-4 h-4 shrink-0" aria-hidden />
              <span>Security #123</span>
            </div>
            <div className="bb-vehicle-dvp-slot bb-vehicle-dvp-slot--cash-a">
              <Banknote className="w-4 h-4 shrink-0" aria-hidden />
              <span>£10,000</span>
            </div>
          </div>
        </div>

        <div className="bb-vehicle-dvp-party bb-vehicle-dvp-party--b">
          <p className="bb-vehicle-dvp-name">Investor B</p>
          <div className="bb-vehicle-dvp-wallet">
            <div className="bb-vehicle-dvp-slot bb-vehicle-dvp-slot--security-b">
              <FileBadge className="w-4 h-4 shrink-0" aria-hidden />
              <span>Security #123</span>
            </div>
            <div className="bb-vehicle-dvp-slot bb-vehicle-dvp-slot--cash-b">
              <Banknote className="w-4 h-4 shrink-0" aria-hidden />
              <span>£10,000</span>
            </div>
          </div>
        </div>

        <div className="bb-vehicle-dvp-lanes" aria-hidden>
          <div className="bb-vehicle-dvp-lane bb-vehicle-dvp-lane--security">
            <div className="bb-vehicle-dvp-lane-line bb-vehicle-dvp-lane-line--right" />
            <div className="bb-vehicle-dvp-shuttle bb-vehicle-dvp-shuttle--security">
              <FileBadge className="w-3.5 h-3.5" />
              <span>Security #123</span>
            </div>
          </div>

          <div className="bb-vehicle-dvp-hub">
            <div className="bb-vehicle-dvp-hub-ring" />
            <div className="bb-vehicle-dvp-hub-core">
              <ArrowLeftRight className="w-5 h-5" />
              <span>Atomic DvP</span>
            </div>
            <p className="bb-vehicle-dvp-hub-note">Both or neither</p>
          </div>

          <div className="bb-vehicle-dvp-lane bb-vehicle-dvp-lane--cash">
            <div className="bb-vehicle-dvp-lane-line bb-vehicle-dvp-lane-line--left" />
            <div className="bb-vehicle-dvp-shuttle bb-vehicle-dvp-shuttle--cash">
              <Banknote className="w-3.5 h-3.5" />
              <span>£10,000</span>
            </div>
          </div>
        </div>
      </div>

      <p className="bb-vehicle-dvp-caption">
        Security travels <strong>A → B</strong> while cash travels <strong>B → A</strong> in one coordinated Canton
        transaction—no leg can succeed alone.
      </p>
    </div>
  );
}
