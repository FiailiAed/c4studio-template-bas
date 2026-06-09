<script lang="ts">
  export let bookingLinkId: string;
  export let duration: number = 60;
  export let bufferTime: number = 0;
  export let availabilityStart: string = '09:00';
  export let availabilityEnd: string = '17:00';
  export let availableDays: number[] = [1, 2, 3, 4, 5];

  type Step = 'calendar' | 'slots' | 'form' | 'confirmed';

  let step: Step = 'calendar';
  let selectedDate = '';
  let selectedSlot = '';
  let availableSlots: string[] = [];
  let loading = false;
  let submitting = false;
  let error = '';

  let name = '';
  let email = '';
  let phone = '';
  let notes = '';

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  let viewYear = todayDate.getFullYear();
  let viewMonth = todayDate.getMonth();

  const MONTHS = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  $: calendarCells = buildCalendar(viewYear, viewMonth);
  $: canGoPrev = new Date(viewYear, viewMonth) > new Date(todayDate.getFullYear(), todayDate.getMonth());

  function buildCalendar(year: number, month: number) {
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<null | { day: number; dateStr: string; available: boolean }> = [];

    for (let i = 0; i < firstDow; i++) cells.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        available: availableDays.includes(dt.getDay()) && dt >= todayDate,
      });
    }

    return cells;
  }

  function prevMonth() {
    const d = new Date(viewYear, viewMonth - 1);
    viewYear = d.getFullYear();
    viewMonth = d.getMonth();
  }

  function nextMonth() {
    const d = new Date(viewYear, viewMonth + 1);
    viewYear = d.getFullYear();
    viewMonth = d.getMonth();
  }

  async function pickDate(dateStr: string) {
    selectedDate = dateStr;
    loading = true;
    error = '';
    try {
      const res = await fetch(
        `/api/booking-slots?bookingLinkId=${encodeURIComponent(bookingLinkId)}&date=${dateStr}`
      );
      if (!res.ok) throw new Error('Failed to load slots');
      const data = await res.json();
      availableSlots = data.availableSlots ?? [];
      step = 'slots';
    } catch {
      error = 'Could not load available times. Please try again.';
    } finally {
      loading = false;
    }
  }

  function pickSlot(slot: string) {
    selectedSlot = slot;
    error = '';
    step = 'form';
  }

  async function submitBooking() {
    if (!name.trim() || !email.trim()) {
      error = 'Name and email are required.';
      return;
    }
    submitting = true;
    error = '';
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingLinkId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          date: selectedDate,
          startTime: selectedSlot,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Booking failed.');
      }
      step = 'confirmed';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Booking failed. Please try again.';
    } finally {
      submitting = false;
    }
  }

  function fmt12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  }

  function fmtDate(dateStr: string): string {
    const [y, mo, d] = dateStr.split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  }
</script>

<div class="booking-widget max-w-lg mx-auto">

  <!-- Calendar -->
  {#if step === 'calendar'}
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <button
        on:click={prevMonth}
        disabled={!canGoPrev}
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous month"
      >
        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
        </svg>
      </button>
      <span class="text-sm font-semibold text-slate-900" style="font-family: 'Lexend', sans-serif;">
        {MONTHS[viewMonth]} {viewYear}
      </span>
      <button
        on:click={nextMonth}
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
        aria-label="Next month"
      >
        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
        </svg>
      </button>
    </div>

    <div class="px-6 py-4">
      <div class="grid grid-cols-7 mb-2">
        {#each DAY_LABELS as label}
          <div class="text-center text-xs font-semibold text-slate-400 py-1" style="font-family: 'Inter', sans-serif;">{label}</div>
        {/each}
      </div>
      <div class="grid grid-cols-7 gap-y-1">
        {#each calendarCells as cell}
          {#if cell === null}
            <div></div>
          {:else}
            <button
              on:click={() => cell.available && pickDate(cell.dateStr)}
              disabled={!cell.available || loading}
              class="
                aspect-square flex items-center justify-center rounded-xl text-sm transition
                {cell.available
                  ? 'text-slate-900 hover:bg-slate-900 hover:text-white cursor-pointer font-medium'
                  : 'text-slate-300 cursor-not-allowed'}
                {selectedDate === cell.dateStr ? 'bg-slate-900 text-white' : ''}
              "
              style="font-family: 'Inter', sans-serif;"
            >
              {cell.day}
            </button>
          {/if}
        {/each}
      </div>
    </div>

    {#if loading}
      <div class="px-6 pb-4 text-center text-sm text-slate-400" style="font-family: 'Inter', sans-serif;">Loading…</div>
    {/if}
    {#if error}
      <div class="mx-6 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" style="font-family: 'Inter', sans-serif;">{error}</div>
    {/if}
  </div>
  <p class="mt-3 text-center text-xs text-slate-400" style="font-family: 'Inter', sans-serif;">Select a date to see available times</p>
  {/if}

  <!-- Slots -->
  {#if step === 'slots'}
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
      <button
        on:click={() => { step = 'calendar'; error = ''; }}
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
        aria-label="Back to calendar"
      >
        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
        </svg>
      </button>
      <span class="text-sm font-semibold text-slate-900" style="font-family: 'Lexend', sans-serif;">{fmtDate(selectedDate)}</span>
    </div>

    <div class="px-6 py-4">
      {#if availableSlots.length === 0}
        <p class="text-sm text-slate-400 text-center py-8" style="font-family: 'Inter', sans-serif;">
          No times available on this day. Try a different date.
        </p>
      {:else}
        <div class="grid grid-cols-3 gap-2">
          {#each availableSlots as slot}
            <button
              on:click={() => pickSlot(slot)}
              class="py-2.5 px-3 rounded-xl border text-sm font-medium transition
                {selectedSlot === slot
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 text-slate-700 hover:border-slate-900 hover:text-slate-900'}"
              style="font-family: 'Inter', sans-serif;"
            >
              {fmt12h(slot)}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  {/if}

  <!-- Contact form -->
  {#if step === 'form'}
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
      <button
        on:click={() => { step = 'slots'; error = ''; }}
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
        aria-label="Back to time slots"
      >
        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
        </svg>
      </button>
      <div>
        <p class="text-sm font-semibold text-slate-900" style="font-family: 'Lexend', sans-serif;">{fmtDate(selectedDate)}</p>
        <p class="text-xs text-slate-500" style="font-family: 'Inter', sans-serif;">{fmt12h(selectedSlot)} · {duration} min</p>
      </div>
    </div>

    <div class="px-6 py-5 flex flex-col gap-4">
      {#if error}
        <div class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" style="font-family: 'Inter', sans-serif;">{error}</div>
      {/if}

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide" style="font-family: 'Inter', sans-serif;">Name <span class="text-red-500">*</span></label>
        <input
          type="text"
          bind:value={name}
          placeholder="Your full name"
          class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          style="font-family: 'Inter', sans-serif;"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide" style="font-family: 'Inter', sans-serif;">Email <span class="text-red-500">*</span></label>
        <input
          type="email"
          bind:value={email}
          placeholder="you@example.com"
          class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          style="font-family: 'Inter', sans-serif;"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide" style="font-family: 'Inter', sans-serif;">Phone</label>
        <input
          type="tel"
          bind:value={phone}
          placeholder="(555) 555-5555"
          class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          style="font-family: 'Inter', sans-serif;"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide" style="font-family: 'Inter', sans-serif;">Notes</label>
        <textarea
          bind:value={notes}
          rows="3"
          placeholder="Anything we should know before the appointment?"
          class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
          style="font-family: 'Inter', sans-serif;"
        ></textarea>
      </div>

      <button
        on:click={submitBooking}
        disabled={submitting}
        class="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        style="font-family: 'Inter', sans-serif;"
      >
        {submitting ? 'Booking…' : 'Confirm booking'}
      </button>
    </div>
  </div>
  {/if}

  <!-- Confirmed -->
  {#if step === 'confirmed'}
  <div class="bg-white rounded-2xl border border-slate-200 px-8 py-12 text-center">
    <div class="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
      <svg class="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
      </svg>
    </div>
    <h3 class="text-xl font-bold text-slate-900 mb-2" style="font-family: 'Lexend', sans-serif;">You're booked!</h3>
    <p class="text-sm text-slate-500 mb-1" style="font-family: 'Inter', sans-serif;">{fmtDate(selectedDate)}</p>
    <p class="text-sm font-semibold text-slate-700" style="font-family: 'Inter', sans-serif;">{fmt12h(selectedSlot)} · {duration} min</p>
    <p class="text-xs text-slate-400 mt-4" style="font-family: 'Inter', sans-serif;">A confirmation will be sent to {email}</p>
  </div>
  {/if}

</div>
