import { useLanguage } from '../../hooks/useLanguage'

// Official FIA brand mark — public/Images/Icon.png everywhere a logo is
// shown (navbar, login screens, etc). `className` controls the footprint
// (callers pass square h-*/w-* sizes); the image itself stays untouched
// and is never stretched/distorted (object-contain preserves its aspect
// ratio at any size). The rounded white chip + border/shadow keeps it
// reading as a clean logo mark on any background (white cards, teal
// headers, dark hero banners alike).
export default function FiaLogo({ className = 'h-14 w-14' }) {
  const { t } = useLanguage()

  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-1 shadow-lg shadow-slate-900/10 ${className}`}
    >
      <img
        src="/Images/Icon.png"
        alt={t('common.fiaLogo')}
        className="h-full w-full rounded-xl object-contain"
      />
    </div>
  )
}
