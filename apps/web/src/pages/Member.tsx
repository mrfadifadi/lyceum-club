import { useEffect, useState, useRef } from "react";
import {
  LogOut,
  Globe,
  Printer,
  Camera,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  X,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridBackdrop } from "@/components/shared/GridBackdrop";
import {
  getAuthUser,
  isAuthenticated,
  clearAuthSession,
  saveAuthSession,
  getAccessToken,
  type AuthUser,
} from "@/lib/auth";
import {
  getUser,
  updateUser,
  getMemberDiscounts,
  type MemberPartnerDiscount,
} from "@/services/api";
import { routes } from "@/lib/routes";

export default function Member() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [discounts, setDiscounts] = useState<MemberPartnerDiscount[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(true);

  // 3D Card Flip state (Front = Member ID, Back = Partner Conventions Squares)
  const [isFlipped, setIsFlipped] = useState(false);
  // Card Theme state (Default: dark luxury matching the website)
  const [cardTheme, setCardTheme] = useState<"dark" | "light">("dark");
  const [selectedPartner, setSelectedPartner] = useState<MemberPartnerDiscount | null>(null);

  // Touch tracking for swipe up / swipe down gestures
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = routes.joinUs;
      return;
    }

    const current = getAuthUser();
    if (!current) {
      window.location.href = routes.joinUs;
      return;
    }

    setUser(current);

    // Refresh user data from database to get the latest photo, major, and details
    getUser(current.id)
      .then((fresh) => {
        setUser((prev) => (prev ? { ...prev, ...fresh } : fresh));
      })
      .catch(() => {
        // Fallback to local session
      })
      .finally(() => {
        setLoading(false);
      });

    // Load partner company conventions and member discounts
    getMemberDiscounts(current.id)
      .then((data) => {
        setDiscounts(data);
      })
      .catch((err) => {
        console.error("Failed loading partner conventions:", err);
      })
      .finally(() => {
        setDiscountsLoading(false);
      });
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    window.location.href = routes.joinUs;
  };

  const handleSetPhoto = async () => {
    if (!user) return;
    const url = window.prompt("Enter your photo image URL:", user.photo_url || "");
    if (url === null) return;

    setPhotoLoading(true);
    try {
      const updated = await updateUser(user.id, { photo_url: url.trim() || null });
      setUser((prev) => (prev ? { ...prev, photo_url: updated.photo_url } : null));

      // Update session storage
      const token = getAccessToken();
      if (token) {
        saveAuthSession({
          access_token: token,
          expires_in: 1800,
          user: {
            ...user,
            photo_url: updated.photo_url,
          },
        });
      }
    } catch (err: any) {
      alert(err.message || "Failed to update photo");
    } finally {
      setPhotoLoading(false);
    }
  };

  // Touch handlers for mobile swipe up & down (like Algerian Progress app)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current !== null && touchCurrentY.current !== null) {
      const diffY = touchCurrentY.current - touchStartY.current;
      // Swiping up -> Reveal back of card (وراء البطاقة)
      if (diffY < -35) {
        setIsFlipped(true);
      }
      // Swiping down -> Return to front of card
      if (diffY > 35) {
        setIsFlipped(false);
      }
    }
    touchStartY.current = null;
    touchCurrentY.current = null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted font-mono">Loading your member card…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const memberId = `#LC-${String(user.id).padStart(4, "0")}`;
  const memberMajor = user.major || "Computer Science & AI";
  const isDarkCard = cardTheme === "dark";

  return (
    <div className="min-h-screen bg-bg text-fg selection:bg-emerald-500/20 selection:text-emerald-300">
      <GridBackdrop />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <a href={routes.home} className="flex items-center gap-2.5">
              <img
                src="/official-crest.png"
                alt="Lyceum Club Batna"
                className="h-9 w-auto object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
              />
              <span className="font-display font-semibold text-sm sm:text-base tracking-wide text-fg">
                Lyceum Club
              </span>
            </a>
            <div className="hidden sm:flex items-center gap-2 border-l border-line pl-3">
              <span className="text-xs text-muted font-mono">Member Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="text-xs h-8">
              <a href={routes.home} className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Website</span>
              </a>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs h-8 text-muted hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12 sm:px-6 flex flex-col items-center justify-center space-y-6">
        {/* Welcome Headline */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 border border-line px-3 py-0.5 text-xs text-muted font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Digital Member Card &amp; Partner Network</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            {user.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
            Swipe up or click the card to flip and view your conventions behind the card.
          </p>
        </div>

        {/* FLIP AFFORDANCE PILL */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="group flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 text-xs font-medium transition-all shadow-lg cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 transition-transform duration-500 ${isFlipped ? "rotate-180" : ""}`} />
            <span>{isFlipped ? "Flip to Front (Member ID)" : "Flip to Back (Partner Conventions)"}</span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-mono font-bold">
              {discounts.length} Partners
            </span>
          </button>

          {/* Theme switcher (Dark Luxury / Clean White) */}
          <button
            type="button"
            onClick={() => setCardTheme(isDarkCard ? "light" : "dark")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-surface-2 text-muted hover:text-fg text-xs transition-colors cursor-pointer"
            title="Switch card theme"
          >
            {isDarkCard ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">White Card</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-zinc-300" />
                <span className="hidden sm:inline">Dark Luxury</span>
              </>
            )}
          </button>
        </div>

        {/* ======================================================== */}
        {/* 3D FLIP CARD CONTAINER (FRONT + BACK BEHIND THE CARD) */}
        {/* ======================================================== */}
        <div
          className="flip-card-container w-full max-w-[530px] aspect-[85.6/54] min-h-[325px] sm:min-h-[345px] select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={`flip-card-inner ${isFlipped ? "is-flipped" : ""}`}>
            {/* ---------------------------------------------------- */}
            {/* FACE 1: FRONT OF THE CARD (Official Member ID) */}
            {/* ---------------------------------------------------- */}
            <div
              className={`flip-card-face p-6 sm:p-7 shadow-2xl flex flex-col justify-between cursor-pointer border ${
                isDarkCard
                  ? "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white border-zinc-800 shadow-black/80"
                  : "bg-white text-zinc-900 border-zinc-200/90 shadow-black/30"
              }`}
              onClick={() => setIsFlipped(true)}
              title="Click or swipe up to reveal partners behind the card"
            >
              {/* Double-line inner border matching shield contour */}
              <div
                className={`absolute inset-2.5 sm:inset-3 rounded-2xl border pointer-events-none ${
                  isDarkCard ? "border-zinc-800/80" : "border-zinc-900/10"
                }`}
              />

              {/* WATERMARK: Official Crest Watermark (Crisp, High Contrast, NOT dim) */}
              <div
                className={`absolute -right-6 -bottom-6 w-56 h-56 pointer-events-none select-none transition-opacity ${
                  isDarkCard
                    ? "opacity-20 filter brightness-125 contrast-125 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                    : "opacity-[0.08] filter grayscale contrast-150"
                }`}
              >
                <img
                  src="/official-crest.png"
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 1. TOP HEADER: Official Crest + LYCEUM CLUB CARD + 2026/2027 Badge */}
              <div
                className={`relative z-10 flex items-center justify-between pb-3 border-b ${
                  isDarkCard ? "border-zinc-800/80" : "border-zinc-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 sm:h-12 w-11 sm:w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isDarkCard ? "bg-black/60 p-1" : "bg-zinc-950 p-1.5 shadow-sm"
                    }`}
                  >
                    <img
                      src="/official-crest.png"
                      alt="Lyceum Crest"
                      className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                  <div>
                    <h2
                      className={`font-display font-extrabold text-base sm:text-lg tracking-wider uppercase leading-tight ${
                        isDarkCard ? "text-white" : "text-zinc-950"
                      }`}
                    >
                      LYCEUM CLUB CARD
                    </h2>
                    <p
                      className={`text-[10px] font-mono tracking-wider ${
                        isDarkCard ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      Batna, Algeria
                    </p>
                  </div>
                </div>

                {/* Right: 2026/2027 Badge */}
                <div
                  className={`rounded-full px-3 py-1 shadow-xs border ${
                    isDarkCard
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      : "bg-zinc-950 text-white border-zinc-800"
                  }`}
                >
                  <span className="font-mono text-[11px] font-semibold tracking-wider">
                    2026 / 2027
                  </span>
                </div>
              </div>

              {/* 2. CARD MIDDLE: Photo Frame + Details */}
              <div className="relative z-10 flex gap-4 sm:gap-5 items-center py-2 sm:py-3">
                {/* Member Photo Frame */}
                <div
                  className={`relative group w-24 sm:w-28 h-28 sm:h-34 rounded-2xl overflow-hidden border-2 shadow-inner shrink-0 flex items-center justify-center ${
                    isDarkCard
                      ? "border-zinc-700 bg-zinc-900/90"
                      : "border-zinc-200 bg-zinc-50"
                  }`}
                >
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-zinc-400">
                      <UserIcon className="h-10 w-10 text-zinc-400 stroke-[1.5]" />
                      <span className="text-[9px] font-medium text-zinc-400 mt-1">
                        No Photo
                      </span>
                    </div>
                  )}

                  {/* Hover Change Photo Overlay */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPhoto();
                    }}
                    disabled={photoLoading}
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-medium p-1 gap-1 cursor-pointer"
                    title="Click to set or change photo"
                  >
                    <Camera className="h-4 w-4 text-zinc-200" />
                    <span>{user.photo_url ? "Change" : "Add Photo"}</span>
                  </button>
                </div>

                {/* Account Details from Database */}
                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2 text-left">
                  {/* ID & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider block ${
                          isDarkCard ? "text-zinc-400" : "text-zinc-400"
                        }`}
                      >
                        ID
                      </span>
                      <p
                        className={`font-mono text-sm sm:text-base font-bold tracking-wider ${
                          isDarkCard ? "text-emerald-400" : "text-zinc-800"
                        }`}
                      >
                        {memberId}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider block text-right ${
                          isDarkCard ? "text-zinc-400" : "text-zinc-400"
                        }`}
                      >
                        Status
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider block ${
                        isDarkCard ? "text-zinc-400" : "text-zinc-400"
                      }`}
                    >
                      Name
                    </span>
                    <p
                      className={`font-display text-base sm:text-lg font-bold truncate tracking-wide leading-tight ${
                        isDarkCard ? "text-white" : "text-zinc-950"
                      }`}
                    >
                      {user.full_name}
                    </p>
                  </div>

                  {/* Major / Specialization */}
                  <div>
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider block ${
                        isDarkCard ? "text-zinc-400" : "text-zinc-400"
                      }`}
                    >
                      Major / Specialization
                    </span>
                    <p
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isDarkCard ? "text-zinc-200" : "text-zinc-800"
                      }`}
                      title={memberMajor}
                    >
                      {memberMajor}
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider block ${
                        isDarkCard ? "text-zinc-400" : "text-zinc-400"
                      }`}
                    >
                      Email
                    </span>
                    <p
                      className={`text-[11px] truncate font-mono ${
                        isDarkCard ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. CARD BOTTOM: Minimalist Footer + Swipe Up hint */}
              <div
                className={`relative z-10 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
                  isDarkCard ? "border-zinc-800/80 text-zinc-400" : "border-zinc-100 text-zinc-400"
                }`}
              >
                <span>Official Membership Card</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold animate-pulse">
                  ▲ Swipe Up / Click for Partners
                </span>
                <span>Lyceum Club</span>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* FACE 2: BACK OF THE CARD (وراء البطاقة - Partner Squares) */}
            {/* ---------------------------------------------------- */}
            <div
              className="flip-card-face flip-card-back p-5 sm:p-6 shadow-2xl flex flex-col justify-between border bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white border-zinc-800 shadow-black/90 cursor-pointer"
              onClick={() => setIsFlipped(false)}
              title="Click or swipe down to flip back to front"
            >
              {/* Double-line inner border */}
              <div className="absolute inset-2.5 sm:inset-3 rounded-2xl border border-zinc-800/80 pointer-events-none" />

              {/* Background watermark */}
              <div className="absolute -left-6 -bottom-6 w-52 h-52 opacity-10 filter brightness-125 pointer-events-none select-none">
                <img src="/official-crest.png" alt="" className="w-full h-full object-contain" />
              </div>

              {/* 1. BACK HEADER */}
              <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/official-crest.png"
                    alt="Lyceum"
                    className="h-8 w-auto object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                  />
                  <div>
                    <h3 className="font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-white">
                      PARTNER CONVENTIONS &amp; DISCOUNTS
                    </h3>
                    <p className="text-[9px] text-zinc-400 font-mono">
                      Batna Student Network &bull; {discounts.length} Active Partners
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                  }}
                  className="rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-mono transition-colors"
                >
                  ↩ Front
                </button>
              </div>

              {/* 2. BACK CENTER: THE GRID SQUARES ("مربعات") */}
              <div
                className="relative z-10 grid grid-cols-3 gap-2.5 sm:gap-3 py-2 my-auto flex-1 overflow-y-auto no-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                {discountsLoading ? (
                  <div className="col-span-3 py-10 text-center text-xs text-muted font-mono">
                    Loading conventions…
                  </div>
                ) : discounts.length === 0 ? (
                  <div className="col-span-3 py-8 text-center text-xs text-muted">
                    No partner conventions assigned yet.
                  </div>
                ) : (
                  discounts.map((partner) => {
                    const hasCustom = Boolean(partner.member_discount);
                    const rate = partner.member_discount || partner.default_discount || "15% OFF";

                    return (
                      <div
                        key={partner.id}
                        onClick={() => setSelectedPartner(partner)}
                        className="group relative rounded-xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-850 hover:border-emerald-500/50 p-2 sm:p-2.5 flex flex-col items-center justify-between text-center transition-all duration-200 hover:scale-[1.03] cursor-pointer shadow-sm"
                        title={partner.name + ": " + rate}
                      >
                        {/* Company Logo Square */}
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-black border border-zinc-800 p-1 flex items-center justify-center shrink-0 shadow-inner group-hover:border-zinc-600 transition-colors">
                          <img
                            src={partner.logo_url}
                            alt={partner.name}
                            className="h-full w-full object-contain filter drop-shadow-xs"
                          />
                        </div>

                        {/* Name */}
                        <div className="w-full my-1">
                          <p className="font-display font-semibold text-[10px] sm:text-[11px] text-zinc-100 truncate w-full group-hover:text-emerald-300 transition-colors">
                            {partner.name}
                          </p>
                          <p className="text-[8px] text-zinc-400 truncate w-full uppercase font-mono">
                            {partner.category || "Convention"}
                          </p>
                        </div>

                        {/* Discount Badge */}
                        <div
                          className={`rounded-full px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold tracking-wider border shadow-xs ${
                            hasCustom
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse"
                              : "bg-zinc-800 border-zinc-700 text-zinc-300"
                          }`}
                        >
                          {rate}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 3. BACK FOOTER */}
              <div className="relative z-10 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-zinc-400">
                <span>Present ID {memberId} at partner store</span>
                <span className="text-emerald-400 font-semibold">
                  ▼ Swipe Down to Flip Front
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS UNDER CARD */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFlipped(!isFlipped)}
            className="text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {isFlipped ? "View Front Card" : "View Partner Conventions"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSetPhoto}
            disabled={photoLoading}
            className="text-xs"
          >
            <Camera className="h-3.5 w-3.5 mr-1.5" />
            {user.photo_url ? "Change Photo" : "Add Photo"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Card
          </Button>

          <Button asChild size="sm" className="text-xs">
            <a href={routes.home}>Go to Website</a>
          </Button>
        </div>

        {/* PARTNER DETAIL MODAL (Opens when tapping a square on the back of the card) */}
        {selectedPartner && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedPartner(null)}
          >
            <div
              className="relative w-full max-w-md rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedPartner(null)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-zinc-950 border border-zinc-800 p-2.5 flex items-center justify-center shrink-0">
                  <img
                    src={selectedPartner.logo_url}
                    alt={selectedPartner.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted font-mono uppercase tracking-wider block">
                    {selectedPartner.category || "Club Partner"}
                  </span>
                  <h3 className="font-display text-xl font-bold text-fg">
                    {selectedPartner.name}
                  </h3>
                  <p className="text-xs text-muted">
                    Batna, Algeria
                  </p>
                </div>
              </div>

              {/* Discount Box */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300">
                    Your Convention Discount:
                  </span>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-sm px-3 py-0.5">
                    {selectedPartner.member_discount || selectedPartner.default_discount || "15% OFF"}
                  </span>
                </div>
                {selectedPartner.member_notes && (
                  <p className="text-xs text-emerald-200/90 pt-1">
                    Note: {selectedPartner.member_notes}
                  </p>
                )}
              </div>

              {/* Description */}
              {selectedPartner.description && (
                <div className="space-y-1 text-xs text-muted">
                  <span className="font-medium text-fg">Convention Details:</span>
                  <p>{selectedPartner.description}</p>
                </div>
              )}

              {/* How to claim */}
              <div className="rounded-xl border border-line bg-surface-2/40 p-3.5 text-xs text-muted space-y-1">
                <p className="font-medium text-fg">How to claim this convention:</p>
                <p>
                  Present this card (ID {memberId}) at checkout or on-site to verify active Lyceum Club membership and apply your discount immediately.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                {selectedPartner.website ? (
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <a
                      href={selectedPartner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit Partner Website
                    </a>
                  </Button>
                ) : <div />}

                <Button size="sm" onClick={() => setSelectedPartner(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Minimal info note */}
        <div className="flex items-center gap-2 text-xs text-muted text-center max-w-md pt-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            Official digital membership card and convention network for Lyceum Club Batna.
          </span>
        </div>
      </main>
    </div>
  );
}