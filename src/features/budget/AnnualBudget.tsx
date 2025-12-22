import { useMemo, useState, useEffect } from 'react';
import { useFilePicker } from 'use-file-picker';
import styles from './Budget.module.css';
import { parse, Categories, getCategoryAmount, setCategories as setBudgetCategories } from './BudgetParser';
import { Transaction } from './budgetSlice';
import { TransactionTable } from './TransactionTable';

const MONTH_NAMES = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек']

function parseMonthIndex(dateStr: string) {
  const d = new Date(dateStr)
  if (!isNaN(d.getTime()))
    return d.getMonth()

  // try dd.MM.yyyy
  const dm = dateStr.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})$/)
  if (dm)
    return parseInt(dm[2], 10) - 1

  // try yyyy-mm-dd
  const ym = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (ym)
    return parseInt(ym[2], 10) - 1

  return -1
}

export function AnnualBudget() {
  const [openFileSelector, { filesContent, loading }] = useFilePicker({ readAs: 'Text', accept: ['.txt'] })
  const [transactions, setTransactions] = useState<Transaction[] | undefined>(undefined)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalText, setModalText] = useState('')
  const [modalField, setModalField] = useState<'contragent' | 'reason'>('contragent')
  const [modalCategory, setModalCategory] = useState<string>(Categories[0]?.[0] ?? '')

  useEffect(() => {
    if (filesContent[0]?.content && !transactions) {
      const parsed = parse(filesContent[0].content)
      setTransactions(parsed)
    }
  }, [filesContent, transactions])

  const table = useMemo(() => {
    if (!transactions) return [] as any
    // Exclude transactions categorized as 'Премахнати' from the annual aggregation
    const sourceTransactions = transactions.filter(t => t.category !== 'Премахнати')

    const rows = Categories.map((cat) => {
      const title = cat[0]
      const months = new Array(12).fill(0)
      let total = 0
      sourceTransactions.forEach((t) => {
        if (t.category !== title) return
        if (t.type !== 'debit') return
        const m = parseMonthIndex(t.date)
        if (m < 0 || m > 11) return
        months[m] += t.amount
        total += t.amount
      })
      return { title, months, total }
    })
    return rows
  }, [transactions])
  // Only show rows that have non-zero totals
  const visibleRows = useMemo(() => table.filter((r: any) => r.total !== 0), [table])

  const monthlyTotals = useMemo(() => {
    const totals = new Array(12).fill(0)
    visibleRows.forEach((r: any) => r.months.forEach((m: number, i: number) => totals[i] += m))
    return totals
  }, [visibleRows])

  const grandTotal = useMemo(() => monthlyTotals.reduce((s, v) => s + v, 0), [monthlyTotals])

  if (loading)
    return <div>Loading ...</div>

  return (
    <div>
      <div className={styles.headline}>
        <h2>Годишен Бюджет</h2>
        Качи годишен файл с движения за агрегация по месеци.
      </div>
      <div className={styles.divider}></div>
      <div className={styles.dataPicket}>
        <button onClick={() => openFileSelector()}> Избери Файл </button>
      </div>

      <div className={styles.divider}></div>

      {transactions && (
        <div>
          <table>
            <thead>
              <tr>
                <th>Категория</th>
                {MONTH_NAMES.map((m) => <th key={m}>{m}</th>)}
                <th>Общо</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row: any, ri: number) => (
                <tr
                  key={ri}
                  onMouseEnter={() => setHoveredCategory(row.title)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={hoveredCategory === row.title ? styles.rowHover : ''}
                >
                  <td>{row.title}</td>
                  {row.months.map((val: number, mi: number) => (
                    <td key={mi} className={styles.highlight}>{val ? val.toFixed(2) : ''}</td>
                  ))}
                  <td className={styles.highlight}>{row.total ? row.total.toFixed(2) : ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Общо по месеци</th>
                {monthlyTotals.map((val: number, i: number) => (
                  <th key={i} className={styles.highlight}>{val ? val.toFixed(2) : ''}</th>
                ))}
                <th className={styles.highlight}>{grandTotal ? grandTotal.toFixed(2) : ''}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Delta vs Average table: per-category row, per-month delta from category average */}
      {transactions && (
        <div>
          <div className={styles.divider}></div>
          <h3>Отклонение от средна месечна стойност (положително = спестено)</h3>
          <table>
            <thead>
              <tr>
                <th>Категория</th>
                {MONTH_NAMES.map((m) => <th key={m}>{m}</th>)}
                <th>Средно</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row: any, ri: number) => {
                const avg = row.months.reduce((s: number, v: number) => s + v, 0) / 12
                return (
                  <tr
                    key={ri}
                    onMouseEnter={() => setHoveredCategory(row.title)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={hoveredCategory === row.title ? styles.rowHover : ''}
                  >
                    <td>{row.title}</td>
                    {row.months.map((val: number, mi: number) => {
                      const delta = avg - val
                      const cls = delta > 0 ? styles.deltaPositive : (delta < 0 ? styles.deltaNegative : '')
                      const disp = (delta > 0 ? '+' : '') + delta.toFixed(2)
                      return <td key={mi} className={cls}>{disp}</td>
                    })}
                    <td className={styles.highlight}>{avg ? avg.toFixed(2) : ''}</td>
                  </tr>
                )
              })}
              <tr>
                <th>Отклонение от средно (по месеци)</th>
                {
                  (() => {
                    const overallAvg = grandTotal / 12
                    return monthlyTotals.map((val: number, i: number) => {
                      const delta = overallAvg - val
                      const cls = delta > 0 ? styles.deltaPositive : (delta < 0 ? styles.deltaNegative : styles.highlight)
                      const disp = (delta > 0 ? '+' : '') + delta.toFixed(2)
                      return <th key={i} className={cls}>{delta ? disp : ''}</th>
                    })
                  })()
                }
                <th className={styles.highlight}></th>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {transactions && (
        <div>
          <div className={styles.divider}></div>
          <>
            {(() => {
              const uncategorized = transactions.filter(t => t.category === 'Без Категория' && Math.abs(t.amount) > 300 && t.type === 'debit')
              const uncSpend = getCategoryAmount(uncategorized, 'debit')
              const uncReceived = 0
              const uncPercentage = grandTotal ? Math.round((uncSpend / grandTotal) * 100) : 0
              return (
                <TransactionTable
                  key={'Без Категория'}
                  title={'Без Категория'}
                  transactions={uncategorized}
                  spend={uncSpend}
                  received={uncReceived}
                  percentage={uncPercentage}
                  onSelectText={(text, field) => {
                    setModalText(text)
                    setModalField(field)
                    setModalCategory(Categories[0]?.[0] ?? '')
                    setModalOpen(true)
                  }}
                />
              )
            })()}

            {modalOpen && (
              <div className={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
                <div className={styles.modal} onClick={e => e.stopPropagation()}>
                  <h3>Добави в категория</h3>
                  <div style={{marginBottom: 8}}>
                    <label>Категория:</label>
                    <select value={modalCategory} onChange={e => setModalCategory(e.target.value)} className={styles.modalSelect}>
                      {Categories.map((c, i) => <option key={i} value={c[0]}>{c[0]}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom: 8}}>
                    <label>Текст:</label>
                    <input className={styles.modalInput} value={modalText} onChange={e => setModalText(e.target.value)} />
                  </div>
                  <div className={styles.modalActions}>
                    <button onClick={() => {
                      const updated = Categories.map((c) => [...c])
                      const idx = updated.findIndex(u => u[0] === modalCategory)
                      if (idx >= 0) {
                        if (!updated[idx].slice(1).includes(modalText)) {
                          updated[idx].push(modalText)
                        }
                      } else {
                        updated.push([modalCategory, modalText])
                      }
                      setBudgetCategories(updated)
                      window.dispatchEvent(new Event('categoriesUpdated'))
                      const apiRoot = window.location.hostname === 'localhost' ? 'http://localhost:4000' : ''
                      fetch(`${apiRoot}/api/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
                        .then(() => setModalOpen(false))
                        .catch(() => {
                          // fallback to download if server unavailable
                          const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'categories.json'
                          a.click()
                          URL.revokeObjectURL(url)
                          setModalOpen(false)
                        })
                    }}>Save</button>
                    <button onClick={() => setModalOpen(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </>
        </div>
      )}
    </div>
  )
}

export default AnnualBudget;
