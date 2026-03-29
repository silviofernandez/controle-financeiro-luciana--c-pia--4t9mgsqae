migrate(
  (app) => {
    const collection = new Collection({
      name: 'transactions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'description', type: 'text' },
        { name: 'unit', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'source', type: 'text' },
        {
          name: 'attachment',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_transactions_date_amount ON transactions (date, amount)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('transactions')
    app.delete(collection)
  },
)
