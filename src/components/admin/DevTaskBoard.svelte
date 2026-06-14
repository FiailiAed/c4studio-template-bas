<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ConvexClient } from 'convex/browser';
  import { api } from '../../../convex/_generated/api.js';

  // ── Props (Svelte 5 runes) ─────────────────────────────────────────────────
  let {
    staticTasks = [] as any[],
    convexUrl = '' as string,
    statusMeta = {} as Record<string, { label: string; color: string; dot: string }>,
    priorityMeta = {} as Record<string, { label: string; color: string }>,
    categoryLabels = {} as Record<string, string>,
    versionOrder = [] as string[],
  } = $props();

  // ── Convex live subscription ───────────────────────────────────────────────
  let dbTasks: any[] = $state([]);
  let convex: ConvexClient;
  let unsub: (() => void) | undefined;

  onMount(() => {
    convex = new ConvexClient(convexUrl);
    unsub = convex.onUpdate(api.devTasks.list, {}, (tasks: any[]) => {
      dbTasks = tasks;
    });
    document.addEventListener('click', handleDocClick);
  });

  onDestroy(() => {
    unsub?.();
    convex?.close();
    document.removeEventListener('click', handleDocClick);
  });

  // ── Constants ──────────────────────────────────────────────────────────────
  const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3, none: 4 };
  const STATUS_ORDER: Record<string, number> = { 'in-progress': 0, planned: 1, overlooked: 2, complete: 3, tabled: 4, future: 5 };
  const ALL_STATUSES = ['planned', 'in-progress', 'overlooked', 'complete', 'tabled', 'future'];

  // ── Merged tasks ───────────────────────────────────────────────────────────
  let allTasks = $derived([
    ...staticTasks.map((t: any) => ({ ...t, source: 'static', _convexId: null as null })),
    ...dbTasks.map((t: any) => ({
      id: t.taskId as number,
      title: t.title as string,
      status: t.status as string,
      priority: t.priority as string,
      version: t.version as string | undefined,
      category: t.category as string,
      notes: (t.notes ?? '') as string,
      source: 'db',
      _convexId: t._id as string,
    })),
  ]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  let statsTotal      = $derived(allTasks.length);
  let statsComplete   = $derived(allTasks.filter((t: any) => t.status === 'complete').length);
  let statsBlockers   = $derived(allTasks.filter((t: any) => t.priority === 'P0' && t.status !== 'complete').length);
  let statsActive     = $derived(allTasks.filter((t: any) => ['in-progress', 'planned'].includes(t.status)).length);
  let statsOverlooked = $derived(allTasks.filter((t: any) => t.status === 'overlooked').length);
  let statsTabled     = $derived(allTasks.filter((t: any) => t.status === 'tabled').length);

  // ── Search + sort ──────────────────────────────────────────────────────────
  let search: string          = $state('');
  let sortCol: string         = $state('id');
  let sortDir: 'asc' | 'desc' = $state('asc');
  let activeTab: string       = $state('active');

  function matches(t: any): boolean {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.notes ?? '').toLowerCase().includes(q) ||
      (categoryLabels[t.category] ?? t.category).toLowerCase().includes(q) ||
      String(t.id) === q
    );
  }

  function sortTasks(tasks: any[]): any[] {
    return [...tasks].sort((a, b) => {
      let av: any, bv: any;
      switch (sortCol) {
        case 'id':       av = a.id; bv = b.id; break;
        case 'title':    av = a.title.toLowerCase(); bv = b.title.toLowerCase(); break;
        case 'category': av = (categoryLabels[a.category] ?? a.category).toLowerCase(); bv = (categoryLabels[b.category] ?? b.category).toLowerCase(); break;
        case 'priority': av = PRIORITY_ORDER[a.priority] ?? 4; bv = PRIORITY_ORDER[b.priority] ?? 4; break;
        case 'version': { const ia = versionOrder.indexOf(a.version ?? ''); const ib = versionOrder.indexOf(b.version ?? ''); av = ia === -1 ? 997 : ia; bv = ib === -1 ? 997 : ib; break; }
        case 'status':   av = STATUS_ORDER[a.status] ?? 5; bv = STATUS_ORDER[b.status] ?? 5; break;
        default:         av = a.id; bv = b.id;
      }
      const cmp = typeof av === 'number' ? av - bv : av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  let filtered = $derived(allTasks.filter(matches));
  let sorted   = $derived(sortTasks(filtered));

  let tabTasks = $derived({
    active:     sorted.filter((t: any) => ['in-progress', 'planned'].includes(t.status)),
    progress:   sorted.filter((t: any) => t.status === 'in-progress'),
    planned:    sorted.filter((t: any) => t.status === 'planned'),
    overlooked: sorted.filter((t: any) => t.status === 'overlooked'),
    complete:   sorted.filter((t: any) => t.status === 'complete'),
    tabled:     sorted.filter((t: any) => ['tabled', 'future'].includes(t.status)),
    all:        sorted,
  } as Record<string, any[]>);

  function setSort(col: string) {
    if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortCol = col; sortDir = 'asc'; }
  }

  function sortIcon(col: string) {
    return sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅';
  }

  function groupByVersion(tasks: any[]) {
    const map: Record<string, any[]> = {};
    for (const t of tasks) { const k = t.version ?? 'Unversioned'; (map[k] ??= []).push(t); }
    const allKeys = [...versionOrder, 'Unversioned', ...Object.keys(map).filter(k => !versionOrder.includes(k) && k !== 'Unversioned')];
    return allKeys.filter(k => map[k]?.length).map(k => ({ version: k, tasks: map[k] }));
  }

  let activeGroups = $derived(groupByVersion(tabTasks.active ?? []));

  // ── Inline status menu ─────────────────────────────────────────────────────
  let statusMenuId: string | null = $state(null);

  function toggleStatusMenu(e: MouseEvent, task: any) {
    e.stopPropagation();
    statusMenuId = statusMenuId === task._convexId ? null : task._convexId;
  }

  async function setStatus(task: any, newStatus: string) {
    statusMenuId = null;
    await convex.mutation(api.devTasks.updateStatus, { id: task._convexId, status: newStatus });
  }

  function handleDocClick() { statusMenuId = null; }

  // ── Add modal ──────────────────────────────────────────────────────────────
  let showAdd: boolean    = $state(false);
  let addTitle: string    = $state('');
  let addStatus: string   = $state('planned');
  let addPriority: string = $state('P2');
  let addVersion: string  = $state('');
  let addCategory: string = $state('admin-ui');
  let addNotes: string    = $state('');
  let addError: string    = $state('');
  let addLoading: boolean = $state(false);

  function openAdd() {
    addTitle = ''; addStatus = 'planned'; addPriority = 'P2';
    addVersion = ''; addCategory = 'admin-ui'; addNotes = '';
    addError = ''; addLoading = false; showAdd = true;
  }

  async function submitAdd() {
    if (!addTitle.trim()) { addError = 'Title is required.'; return; }
    addLoading = true; addError = '';
    try {
      await convex.mutation(api.devTasks.create, {
        title: addTitle.trim(), status: addStatus, priority: addPriority,
        version: addVersion.trim() || undefined, category: addCategory,
        notes: addNotes.trim() || undefined,
      });
      showAdd = false;
    } catch (e: any) { addError = e?.message || 'Something went wrong.'; }
    finally { addLoading = false; }
  }

  // ── Edit modal ─────────────────────────────────────────────────────────────
  let showEdit: boolean    = $state(false);
  let editingTask: any     = $state(null);
  let editTitle: string    = $state('');
  let editStatus: string   = $state('planned');
  let editPriority: string = $state('P2');
  let editVersion: string  = $state('');
  let editCategory: string = $state('admin-ui');
  let editNotes: string    = $state('');
  let editError: string    = $state('');
  let editLoading: boolean = $state(false);

  function openEdit(task: any) {
    editingTask = task;
    editTitle = task.title; editStatus = task.status; editPriority = task.priority;
    editVersion = task.version ?? ''; editCategory = task.category; editNotes = task.notes ?? '';
    editError = ''; editLoading = false; showEdit = true;
  }

  async function submitEdit() {
    if (!editTitle.trim()) { editError = 'Title is required.'; return; }
    editLoading = true; editError = '';
    try {
      await convex.mutation(api.devTasks.update, {
        id: editingTask._convexId,
        title: editTitle.trim(), status: editStatus, priority: editPriority,
        version: editVersion.trim() || undefined, category: editCategory,
        notes: editNotes.trim() || undefined,
      });
      showEdit = false; editingTask = null;
    } catch (e: any) { editError = e?.message || 'Something went wrong.'; }
    finally { editLoading = false; }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  let deleteId: string | null = $state(null);

  async function confirmDelete() {
    if (!deleteId) return;
    await convex.mutation(api.devTasks.remove, { id: deleteId as any });
    deleteId = null;
  }
</script>

<!-- ═══════════════════════════════════════════════════════════════════════════
     SNIPPETS
════════════════════════════════════════════════════════════════════════════ -->

{#snippet taskTable(tasks: any[])}
  {#if tasks.length === 0}
    <p class="text-sm text-center py-12 text-slate-400" style="font-family:'Inter',sans-serif;">No tasks in this view.</p>
  {:else}
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50">
            {#each [
              { col: 'id',       label: '#',        cls: 'w-12' },
              { col: 'title',    label: 'Task',     cls: '' },
              { col: 'category', label: 'Category', cls: 'w-28 hidden md:table-cell' },
              { col: 'priority', label: 'Priority', cls: 'w-24' },
              { col: 'version',  label: 'Target',   cls: 'w-20 hidden lg:table-cell' },
              { col: 'status',   label: 'Status',   cls: 'w-36' },
            ] as h}
              <th
                onclick={() => setSort(h.col)}
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap transition hover:text-slate-700 {h.cls} {sortCol === h.col ? 'text-slate-900' : 'text-slate-500'}"
                style="font-family:'Inter',sans-serif;"
              >
                {h.label}
                <span class="ml-1 {sortCol === h.col ? 'text-slate-700' : 'text-slate-300'}">{sortIcon(h.col)}</span>
              </th>
            {/each}
            <th class="w-16 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          {#each tasks as task (task.source === 'db' ? task._convexId : task.id)}
            {@const sm  = statusMeta[task.status]   ?? { label: task.status,   color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }}
            {@const pm  = priorityMeta[task.priority] ?? { label: task.priority, color: 'bg-slate-100 text-slate-600' }}
            {@const cat = categoryLabels[task.category] ?? task.category}
            <tr class="hover:bg-slate-50 transition" style="font-family:'Inter',sans-serif;">

              <!-- ID -->
              <td class="px-4 py-3 text-xs font-mono text-slate-400">{task.id}</td>

              <!-- Title + notes -->
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-slate-900 leading-snug">{task.title}</p>
                {#if task.notes}
                  <p class="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.notes}</p>
                {/if}
              </td>

              <!-- Category -->
              <td class="px-4 py-3 hidden md:table-cell">
                <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">{cat}</span>
              </td>

              <!-- Priority -->
              <td class="px-4 py-3">
                {#if task.priority !== 'none'}
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap {pm.color}">{task.priority}</span>
                {:else}
                  <span class="text-xs text-slate-300">—</span>
                {/if}
              </td>

              <!-- Version -->
              <td class="px-4 py-3 hidden lg:table-cell">
                {#if task.version}
                  <span class="text-xs font-mono text-slate-400">{task.version}</span>
                {:else}
                  <span class="text-xs text-slate-300">—</span>
                {/if}
              </td>

              <!-- Status — clickable picker for DB tasks -->
              <td class="px-4 py-3">
                {#if task.source === 'db'}
                  <div class="relative inline-block">
                    <button
                      onclick={(e) => toggleStatusMenu(e, task)}
                      class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap cursor-pointer hover:opacity-80 transition {sm.color}"
                      title="Change status"
                    >
                      <span class="w-1.5 h-1.5 rounded-full shrink-0 {sm.dot}"></span>
                      {sm.label}
                      <svg class="w-2.5 h-2.5 ml-0.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {#if statusMenuId === task._convexId}
                      <div
                        onclick={(e) => e.stopPropagation()}
                        class="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[148px]"
                      >
                        {#each ALL_STATUSES as s}
                          {@const sm2 = statusMeta[s] ?? { label: s, color: '', dot: '' }}
                          <button
                            onclick={() => setStatus(task, s)}
                            class="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 transition text-left {task.status === s ? 'font-semibold' : 'font-normal'}"
                          >
                            <span class="w-1.5 h-1.5 rounded-full shrink-0 {sm2.dot}"></span>
                            {sm2.label}
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {:else}
                  <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap {sm.color}">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0 {sm.dot}"></span>
                    {sm.label}
                  </span>
                {/if}
              </td>

              <!-- Actions — edit + delete for DB tasks -->
              <td class="px-4 py-3">
                {#if task.source === 'db'}
                  <div class="flex items-center gap-1">
                    <button
                      onclick={() => openEdit(task)}
                      class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      aria-label="Edit task"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onclick={() => deleteId = task._convexId}
                      class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      aria-label="Delete task"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/snippet}

<!-- ═══════════════════════════════════════════════════════════════════════════
     MARKUP
════════════════════════════════════════════════════════════════════════════ -->

<div style="font-family:'Inter',sans-serif;">

  <!-- ── Header row ─────────────────────────────────────────────────────────── -->
  <div class="flex items-start justify-between gap-4 mb-6">
    <p class="text-sm text-slate-500">{statsTotal} tracked tasks — live sync active.</p>
    <button
      onclick={openAdd}
      class="shrink-0 flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      New Task
    </button>
  </div>

  <!-- ── Search ─────────────────────────────────────────────────────────────── -->
  <div class="relative mb-6">
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
    <input
      bind:value={search}
      type="text"
      placeholder="Search by title, notes, category, or ID…"
      class="w-full pl-9 pr-24 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
      autocomplete="off"
    />
    {#if search}
      <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        <button onclick={() => search = ''} class="text-slate-400 hover:text-slate-600 transition p-0.5" aria-label="Clear search">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/if}
  </div>

  <!-- ── Stats ──────────────────────────────────────────────────────────────── -->
  <div class="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
    {#each [
      { label: 'Total',      value: statsTotal,      tc: 'text-slate-900',   bg: 'bg-white' },
      { label: 'Complete',   value: statsComplete,   tc: 'text-emerald-700', bg: 'bg-emerald-50' },
      { label: 'Blockers',   value: statsBlockers,   tc: 'text-red-700',     bg: 'bg-red-50' },
      { label: 'Active',     value: statsActive,     tc: 'text-violet-700',  bg: 'bg-violet-50' },
      { label: 'Overlooked', value: statsOverlooked, tc: 'text-rose-700',    bg: 'bg-rose-50' },
      { label: 'Tabled',     value: statsTabled,     tc: 'text-blue-700',    bg: 'bg-blue-50' },
    ] as s}
      <div class="{s.bg} rounded-xl border border-slate-200 px-4 py-3">
        <p class="text-2xl font-bold {s.tc}" style="font-family:'Lexend',sans-serif;">{s.value}</p>
        <p class="text-xs text-slate-500 mt-0.5">{s.label}</p>
      </div>
    {/each}
  </div>

  <!-- ── Tab nav ────────────────────────────────────────────────────────────── -->
  <div class="flex gap-0 border-b border-slate-200 mb-6 overflow-x-auto">
    {#each [
      { key: 'active',     label: 'Active',          count: tabTasks.active.length },
      { key: 'progress',   label: 'In Progress',     count: tabTasks.progress.length },
      { key: 'planned',    label: 'Planned',         count: tabTasks.planned.length },
      { key: 'overlooked', label: 'Overlooked',      count: tabTasks.overlooked.length },
      { key: 'complete',   label: 'Complete',        count: tabTasks.complete.length },
      { key: 'tabled',     label: 'Tabled & Future', count: tabTasks.tabled.length },
      { key: 'all',        label: 'All',             count: tabTasks.all.length },
    ] as tab}
      <button
        onclick={() => activeTab = tab.key}
        class="shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
          {activeTab === tab.key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}"
      >
        {tab.label}
        <span class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full {activeTab === tab.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}">
          {tab.count}
        </span>
      </button>
    {/each}
  </div>

  <!-- ── Active tab: version-grouped when not searching ────────────────────── -->
  {#if activeTab === 'active'}
    {#if search.trim()}
      {@render taskTable(tabTasks.active)}
    {:else}
      {#each activeGroups as group (group.version)}
        <div class="mb-10">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-500">{group.version}</span>
            <span class="text-xs text-slate-400">{group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}</span>
          </div>
          {@render taskTable(group.tasks)}
        </div>
      {:else}
        <p class="text-sm text-center py-12 text-slate-400">No active tasks.</p>
      {/each}
    {/if}
  {/if}

  <!-- ── Overlooked callout ─────────────────────────────────────────────────── -->
  {#if activeTab === 'overlooked'}
    <div class="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl">
      <p class="text-sm text-rose-700"><strong>Not formally captured in the roadmap or README.</strong> These gaps were identified by reviewing the codebase. Each should be triaged — promoted to Planned, Tabled, or dismissed.</p>
    </div>
  {/if}

  <!-- ── All other tabs ─────────────────────────────────────────────────────── -->
  {#each ['progress','planned','overlooked','complete','tabled','all'] as key (key)}
    {#if activeTab === key}
      {@render taskTable(tabTasks[key])}
    {/if}
  {/each}

  <div class="pb-16"></div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     MODALS
════════════════════════════════════════════════════════════════════════════ -->

<!-- Delete confirm -->
{#if deleteId}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
    onclick={() => deleteId = null}
    role="dialog"
    aria-modal="true"
    aria-label="Delete confirmation"
  >
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6" onclick={(e) => e.stopPropagation()} style="font-family:'Inter',sans-serif;">
      <h3 class="text-base font-semibold text-slate-900 mb-2" style="font-family:'Lexend',sans-serif;">Delete task?</h3>
      <p class="text-sm text-slate-500 mb-6">This cannot be undone.</p>
      <div class="flex justify-end gap-3">
        <button onclick={() => deleteId = null} class="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition">Cancel</button>
        <button onclick={confirmDelete} class="text-sm font-medium bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">Delete</button>
      </div>
    </div>
  </div>
{/if}

<!-- Add / Edit modal (shared layout) -->
{#if showAdd || showEdit}
  {@const isAdd    = showAdd}
  {@const onClose  = isAdd ? () => { showAdd = false; } : () => { showEdit = false; editingTask = null; }}
  {@const onSubmit = isAdd ? submitAdd : submitEdit}
  {@const err      = isAdd ? addError  : editError}
  {@const loading  = isAdd ? addLoading : editLoading}

  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    role="dialog"
    aria-modal="true"
    aria-label={isAdd ? 'Add new task' : 'Edit task'}
  >
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg" style="font-family:'Inter',sans-serif;">

      <!-- Modal header -->
      <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-900" style="font-family:'Lexend',sans-serif;">{isAdd ? 'New Task' : 'Edit Task'}</h2>
        <button onclick={onClose} class="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100" aria-label="Close">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form body -->
      <div class="px-6 py-5 space-y-4">

        <!-- Title -->
        <div>
          <label for="f-title" class="block text-xs font-semibold text-slate-700 mb-1.5">Title <span class="text-red-500">*</span></label>
          {#if isAdd}
            <input id="f-title" bind:value={addTitle} type="text" placeholder="Short, actionable task title" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 transition" />
          {:else}
            <input id="f-title" bind:value={editTitle} type="text" placeholder="Short, actionable task title" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 transition" />
          {/if}
        </div>

        <!-- Category + Status -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="f-category" class="block text-xs font-semibold text-slate-700 mb-1.5">Category <span class="text-red-500">*</span></label>
            {#if isAdd}
              <select id="f-category" bind:value={addCategory} class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white transition">
                {#each Object.entries(categoryLabels) as [k, v]}<option value={k}>{v}</option>{/each}
              </select>
            {:else}
              <select id="f-category" bind:value={editCategory} class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white transition">
                {#each Object.entries(categoryLabels) as [k, v]}<option value={k}>{v}</option>{/each}
              </select>
            {/if}
          </div>
          <div>
            <label for="f-status" class="block text-xs font-semibold text-slate-700 mb-1.5">Status <span class="text-red-500">*</span></label>
            {#if isAdd}
              <select id="f-status" bind:value={addStatus} class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white transition">
                {#each ALL_STATUSES as s}<option value={s}>{statusMeta[s]?.label ?? s}</option>{/each}
              </select>
            {:else}
              <select id="f-status" bind:value={editStatus} class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white transition">
                {#each ALL_STATUSES as s}<option value={s}>{statusMeta[s]?.label ?? s}</option>{/each}
              </select>
            {/if}
          </div>
        </div>

        <!-- Priority + Version -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="f-priority" class="block text-xs font-semibold text-slate-700 mb-1.5">Priority <span class="text-red-500">*</span></label>
            {#if isAdd}
              <select id="f-priority" bind:value={addPriority} class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white transition">
                {#each Object.entries(priorityMeta) as [k, v]}<option value={k}>{v.label}</option>{/each}
              </select>
            {:else}
              <select id="f-priority" bind:value={editPriority} class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white transition">
                {#each Object.entries(priorityMeta) as [k, v]}<option value={k}>{v.label}</option>{/each}
              </select>
            {/if}
          </div>
          <div>
            <label for="f-version" class="block text-xs font-semibold text-slate-700 mb-1.5">Target Version</label>
            {#if isAdd}
              <input id="f-version" bind:value={addVersion} type="text" placeholder="e.g. v0.0.8" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 transition" />
            {:else}
              <input id="f-version" bind:value={editVersion} type="text" placeholder="e.g. v0.0.8" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 transition" />
            {/if}
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label for="f-notes" class="block text-xs font-semibold text-slate-700 mb-1.5">Notes</label>
          {#if isAdd}
            <textarea id="f-notes" bind:value={addNotes} rows="3" placeholder="Context, implementation details, links…" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 transition resize-none"></textarea>
          {:else}
            <textarea id="f-notes" bind:value={editNotes} rows="3" placeholder="Context, implementation details, links…" class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 transition resize-none"></textarea>
          {/if}
        </div>

        {#if err}<p class="text-sm text-red-600">{err}</p>{/if}
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 pb-5 pt-2 border-t border-slate-100">
        <button onclick={onClose} class="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition">Cancel</button>
        <button onclick={onSubmit} disabled={loading} class="text-sm font-medium bg-slate-900 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition disabled:opacity-50">
          {loading ? 'Saving…' : (isAdd ? 'Add Task' : 'Save Changes')}
        </button>
      </div>
    </div>
  </div>
{/if}
