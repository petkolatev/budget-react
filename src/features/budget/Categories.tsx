import React, { useState } from 'react';
import styles from './Budget.module.css';
import initialCategories from './categories.json';
import { Categories as BudgetCategories, setCategories as setBudgetCategories } from './BudgetParser';

export function CategoriesPage() {
  const [categories, setCategories] = useState<string[][]>(BudgetCategories as string[][])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editItems, setEditItems] = useState('')

  const [newName, setNewName] = useState('')
  const [newItems, setNewItems] = useState('')

  const startEdit = (idx: number) => {
    setEditingIndex(idx)
    setEditName(categories[idx][0] || '')
    setEditItems((categories[idx].slice(1) || []).join(', '))
  }

  const saveEdit = () => {
    if (editingIndex === null) return
    const updated = [...categories]
    const items = editItems.split(',').map(s => s.trim()).filter(Boolean)
    updated[editingIndex] = [editName, ...items]
    setCategories(updated)
    setBudgetCategories(updated)
    // POST to backend to persist
    fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {})
    window.dispatchEvent(new Event('categoriesUpdated'))
    setEditingIndex(null)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
  }

  const removeCategory = (idx: number) => {
    const updated = categories.filter((_, i) => i !== idx)
    setCategories(updated)
    setBudgetCategories(updated)
    fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {})
    window.dispatchEvent(new Event('categoriesUpdated'))
    setEditingIndex(null)
  }

  const addCategory = () => {
    const items = newItems.split(',').map(s => s.trim()).filter(Boolean)
    const updated = [...categories, [newName, ...items]]
    setCategories(updated)
    setBudgetCategories(updated)
    fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {})
    window.dispatchEvent(new Event('categoriesUpdated'))
    setNewName('')
    setNewItems('')
  }

  React.useEffect(() => {
    const onUpdate = () => setCategories(BudgetCategories)
    window.addEventListener('categoriesUpdated', onUpdate)
    return () => window.removeEventListener('categoriesUpdated', onUpdate)
  }, [])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(categories, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'categories.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className={styles.headline}>
        <h2>Категории</h2>
        Списък с всички категории и съответните им елементи.
      </div>
      <div className={styles.divider}></div>

      <div style={{marginBottom: 12}}>
        <strong>Добави категория</strong>
        <div style={{display: 'flex', gap: 8, marginTop: 6}}>
          <input placeholder="Име на категория" value={newName} onChange={e => setNewName(e.target.value)} />
          <input placeholder="Елементи (запетая разделя)" value={newItems} onChange={e => setNewItems(e.target.value)} style={{flex: 1}} />
          <button onClick={addCategory}>Добави</button>
          <button onClick={exportJson}>Експортирай JSON</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Категория</th>
            <th>Елементи</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, idx) => (
            <tr key={idx}>
              <td style={{whiteSpace: 'nowrap', fontWeight: 600}}>
                {editingIndex === idx ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} />
                ) : (
                  cat[0]
                )}
              </td>
              <td>
                {editingIndex === idx ? (
                  <input value={editItems} onChange={e => setEditItems(e.target.value)} style={{width: '100%'}} />
                ) : (
                  <div className={styles.categoryItems}>
                    {cat.slice(1).map((it, i) => (
                      <span key={i} className={styles.categoryItem}>{it}</span>
                    ))}
                  </div>
                )}
              </td>
              <td>
                {editingIndex === idx ? (
                  <>
                    <button onClick={saveEdit}>Запази</button>
                    <button onClick={cancelEdit}>Откажи</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(idx)}>Редактирай</button>
                    <button onClick={() => removeCategory(idx)}>Изтрий</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CategoriesPage;
