migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('teams')

    const teamsToSeed = ['Financeiro', 'Operacional', 'Vendas']

    for (const name of teamsToSeed) {
      try {
        app.findFirstRecordByData('teams', 'name', name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', name)
        app.save(record)
      }
    }
  },
  (app) => {
    const teamsToSeed = ['Financeiro', 'Operacional', 'Vendas']
    for (const name of teamsToSeed) {
      try {
        const record = app.findFirstRecordByData('teams', 'name', name)
        app.delete(record)
      } catch (_) {}
    }
  },
)
