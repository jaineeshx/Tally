import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { computeBaselineWeekly, toComparisons } from '../lib/calculateFootprint';
import factors from '../data/emissionFactors.json';
import type { CommuteMode, HouseholdSize } from '../types';

export default function Onboarding() {
  const { saveProfile, completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [city, setCity] = useState('Mumbai');
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('bus');
  const [householdSize, setHouseholdSize] = useState<HouseholdSize>('2-3');
  const [baseline, setBaseline] = useState<number | null>(null);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      // Calculate baseline
      const weeklyBaseline = computeBaselineWeekly({
        commute_mode: commuteMode,
        household_size: householdSize,
      });
      setBaseline(weeklyBaseline);
      setStep(4);
    }
  };

  const handleFinish = () => {
    saveProfile({
      city,
      commute_mode: commuteMode,
      household_size: householdSize,
      baseline_co2e_week: baseline ?? 0,
    });
    completeOnboarding();
  };

  const commuteOptions: { id: CommuteMode; label: string; icon: string }[] = [
    { id: 'walk_cycle', label: 'Walk / Cycle', icon: '🚶' },
    { id: 'bus', label: 'Bus / Auto', icon: '🚌' },
    { id: 'metro', label: 'Train / Metro', icon: '🚇' },
    { id: 'two_wheeler', label: 'Two-Wheeler', icon: '🛵' },
    { id: 'car_solo', label: 'Drive Solo', icon: '🚗' },
    { id: 'car_shared_2', label: 'Carpool / Shared', icon: '🚙' },
  ];

  const householdOptions: { id: HouseholdSize; label: string; desc: string }[] = [
    { id: '1', label: 'Just Me', desc: 'Solo setup' },
    { id: '2-3', label: '2-3 People', desc: 'Average flat' },
    { id: '4+', label: '4+ People', desc: 'Large family / group' },
  ];

  return (
    <div className="page flex items-center justify-center min-h-[80dvh] max-w-sm py-8">
      <div className="card w-full p-6 md:p-8 flex flex-col gap-6 animate-scale-in">
        {step < 4 && (
          <div className="flex justify-between items-center">
            <span className="section-label">Step {step} of 3</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-gold-500' : 'bg-cream-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h1 className="text-2xl font-display font-bold text-charcoal-900 leading-tight">
              Where do you base your day?
            </h1>
            <p className="text-sm text-charcoal-500">
              Your location helps us estimate baseline grid costs and electricity impact.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <label htmlFor="city-select" className="text-xs font-semibold text-charcoal-600">
                SELECT CITY
              </label>
              <select
                id="city-select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-400 bg-cream-50 focus:border-gold-500 focus:outline-none text-charcoal-800 font-medium"
              >
                {factors.indian_cities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleNext} className="btn-primary w-full mt-4">
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h1 className="text-2xl font-display font-bold text-charcoal-900 leading-tight">
              How do you usually commute?
            </h1>
            <p className="text-sm text-charcoal-500">
              Select your primary mode of travel for work or daily runs.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {commuteOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCommuteMode(opt.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                    commuteMode === opt.id
                      ? 'border-gold-500 bg-gold-50 ring-2 ring-gold-500/20'
                      : 'border-cream-300 hover:border-cream-400 bg-white'
                  }`}
                >
                  <span className="text-2xl" role="img" aria-hidden="true">
                    {opt.icon}
                  </span>
                  <span className="text-xs font-semibold text-charcoal-700">{opt.label}</span>
                </button>
              ))}
            </div>
            <button onClick={handleNext} className="btn-primary w-full mt-4">
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h1 className="text-2xl font-display font-bold text-charcoal-900 leading-tight">
              Household Size
            </h1>
            <p className="text-sm text-charcoal-500">
              Used to calculate your share of baseline utility costs.
            </p>
            <div className="flex flex-col gap-3 mt-2">
              {householdOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setHouseholdSize(opt.id)}
                  className={`flex justify-between items-center px-5 py-4 rounded-2xl border text-left transition-all ${
                    householdSize === opt.id
                      ? 'border-gold-500 bg-gold-50 ring-2 ring-gold-500/20'
                      : 'border-cream-300 hover:border-cream-400 bg-white'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-charcoal-800">{opt.label}</div>
                    <div className="text-xs text-charcoal-500">{opt.desc}</div>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      householdSize === opt.id ? 'border-gold-500 bg-gold-500' : 'border-cream-400'
                    }`}
                  >
                    {householdSize === opt.id && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={handleNext} className="btn-primary w-full mt-4">
              See My Baseline
            </button>
          </div>
        )}

        {step === 4 && baseline !== null && (
          <div className="flex flex-col gap-5 text-center animate-slide-up">
            <div className="flex flex-col gap-1">
              <span className="section-label">Your Initial Estimate</span>
              <h1 className="text-3xl font-display font-extrabold text-charcoal-900 leading-tight">
                Your Starting Number
              </h1>
            </div>

            <div className="py-6 px-4 bg-cream-200 rounded-3xl border border-cream-300 flex flex-col gap-2">
              <div className="text-4xl font-display font-extrabold text-gold-500">
                {baseline} <span className="text-lg font-sans font-semibold text-charcoal-500">kg CO₂e</span>
              </div>
              <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                ESTIMATED WEEKLY FOOTPRINT
              </p>
            </div>

            <div className="flex flex-col gap-3 text-left bg-white p-4 rounded-2xl border border-cream-300">
              <h2 className="text-xs font-bold text-charcoal-600 uppercase tracking-wider">
                What does this equal?
              </h2>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-label="Drive equivalent">🚗</span>
                  <div>
                    <div className="text-sm font-bold text-charcoal-800">
                      ~{toComparisons(baseline).km_driven} km
                    </div>
                    <div className="text-[10px] text-charcoal-500 uppercase font-semibold">of driving</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-label="Phone charges">🔌</span>
                  <div>
                    <div className="text-sm font-bold text-charcoal-800">
                      ~{toComparisons(baseline).phone_charges.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-charcoal-500 uppercase font-semibold">phone charges</div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-charcoal-500 text-balance">
              This is your starting baseline. Don't worry about it — we'll help you track everyday choices to spot easy ways to save cash and lower your score.
            </p>

            <button onClick={handleFinish} className="btn-primary w-full mt-2">
              Start Tracking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
