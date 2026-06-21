import { useRef, useState, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { useApp } from '../../context/AppContext';
import { calculateFootprint, toComparisons } from '../../lib/calculateFootprint';
import { Share2, Download, Check } from 'lucide-react';

export default function RecapCard() {
  const { logs } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter logs for this week
  const weeklyLogs = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(startOfWeek.setDate(diff));
    return logs.filter((l) => new Date(l.logged_at) >= monday);
  }, [logs]);

  const totals = useMemo(() => calculateFootprint(weeklyLogs), [weeklyLogs]);
  const comparisons = useMemo(() => toComparisons(totals.total_co2e_kg), [totals.total_co2e_kg]);

  // Compute total cost logged
  const totalCost = useMemo(() => {
    return weeklyLogs.reduce((sum, log) => sum + (log.cost_estimate_inr ?? 0), 0);
  }, [weeklyLogs]);

  // Count food delivery / solo drives to tailor the fun text
  const deliveryCount = useMemo(() => {
    return weeklyLogs.filter((l) => l.subcategory === 'food_delivery_avg').length;
  }, [weeklyLogs]);

  const soloDriveCount = useMemo(() => {
    return weeklyLogs.filter((l) => l.subcategory === 'car_solo').length;
  }, [weeklyLogs]);

  const roastText = useMemo(() => {
    if (weeklyLogs.length === 0) {
      return "Logged absolutely nothing. Off grid, or just too busy saving the world? Start logging to get roasted next week.";
    }
    if (deliveryCount >= 3) {
      return `Ordered delivery ${deliveryCount} times. Your delivery driver is basically part of the family now. But hey, you saved a few minutes of cooking!`;
    }
    if (soloDriveCount >= 4) {
      return `Drove solo ${soloDriveCount} times. You must really love that radio station. Try transit next week to put some rupee notes back in your wallet.`;
    }
    return "Kept it clean, efficient, and light on the wallet. Top-tier optimization. YNAB would be proud.";
  }, [weeklyLogs, deliveryCount, soloDriveCount]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Ensure fonts are loaded and styling settles
      await new Promise((resolve) => setTimeout(resolve, 300));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#FAFAF7',
        style: {
          transform: 'scale(1)',
        },
      });

      const link = document.createElement('a');
      link.download = `tally-weekly-recap-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = () => {
    const text = `My weekly summary on Tally: logged ${totals.total_co2e_kg} kg CO2e, equivalent to ${comparisons.phone_charges} phone charges! ${roastText}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Target card for html-to-image */}
      <div className="overflow-hidden rounded-3xl border border-cream-300">
        <div
          ref={cardRef}
          className="p-6 bg-cream-100 flex flex-col gap-6 w-full max-w-sm select-none"
        >
          {/* Logo & Header */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-display font-extrabold text-gold-500 tracking-wider">
              TALLY.
            </span>
            <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest bg-cream-200 px-2.5 py-1 rounded-lg">
              WEEKLY RECAP
            </span>
          </div>

          {/* Large Stat Box */}
          <div className="flex flex-col gap-1 text-center py-4 bg-white rounded-3xl border border-cream-200 shadow-warm-sm">
            <div className="text-5xl font-display font-extrabold text-charcoal-900 leading-none">
              {comparisons.phone_charges.toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">
              Smartphone Charges
            </div>
            <div className="text-xs text-charcoal-500 font-semibold mt-1">
              Your weekly footprint in relatable terms
            </div>
          </div>

          {/* Details list */}
          <div className="flex flex-col gap-3 bg-white/50 p-4 rounded-2xl border border-cream-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-charcoal-500 uppercase tracking-wider">
                Total CO₂e
              </span>
              <span className="font-extrabold text-charcoal-800">{totals.total_co2e_kg} kg</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-cream-200/60 pt-2">
              <span className="font-bold text-charcoal-500 uppercase tracking-wider">
                Driving Equivalent
              </span>
              <span className="font-extrabold text-charcoal-800">
                {comparisons.km_driven} km
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-cream-200/60 pt-2">
              <span className="font-bold text-charcoal-500 uppercase tracking-wider">
                Estimated Spend
              </span>
              <span className="font-extrabold text-charcoal-800">
                ₹{totalCost.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Roast/Copy content */}
          <p className="text-xs font-semibold text-charcoal-600 leading-relaxed italic text-center text-balance bg-gold-50/50 p-3.5 rounded-2xl border border-gold-200/60">
            "{roastText}"
          </p>

          <div className="text-center text-[9px] font-bold text-charcoal-400 uppercase tracking-widest mt-1">
            ballot-oracle.web.app • No leaf icons, just raw stats.
          </div>
        </div>
      </div>

      {/* Sharing controls */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-primary py-3 text-xs"
        >
          <Download size={16} />
          {downloading ? 'Generating...' : 'Save Image'}
        </button>

        <button onClick={handleCopy} className="btn-secondary py-3 text-xs">
          {copied ? <Check size={16} className="text-sage-500" /> : <Share2 size={16} />}
          {copied ? 'Copied Link!' : 'Copy Summary'}
        </button>
      </div>
    </div>
  );
}
