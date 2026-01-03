// forms.js - Gestion des formulaires et données

const Forms = {
  // Charger les enregistrements avec compatibilité
  loadRecords: function(type) {
    const prefixedKey = 'cs_la_reference_' + type;
    const unprefixedKey = type;
    
    // Try prefixed first
    let data = localStorage.getItem(prefixedKey);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error parsing ' + prefixedKey, e);
      }
    }
    
    // Fallback to unprefixed
    data = localStorage.getItem(unprefixedKey);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error parsing ' + unprefixedKey, e);
      }
    }
    
    return [];
  },

  // Sauvegarder les enregistrements
  saveRecords: function(type, records) {
    const key = 'cs_la_reference_' + type;
    try {
      localStorage.setItem(key, JSON.stringify(records));
      return true;
    } catch (e) {
      console.error('Error saving ' + key, e);
      return false;
    }
  },

  // Sauvegarder un enregistrement
  saveRecord: function(type, record) {
    const records = this.loadRecords(type);
    
    if (record.id) {
      // Update existing
      const index = records.findIndex(r => r.id === record.id);
      if (index !== -1) {
        records[index] = record;
      } else {
        return { ok: false, error: 'Record not found' };
      }
    } else {
      // Create new
      record.id = generateId();
      records.push(record);
    }
    
    const saved = this.saveRecords(type, records);
    return { ok: saved, record: record };
  },

  // Récupérer un enregistrement
  getRecord: function(type, id) {
    const records = this.loadRecords(type);
    return records.find(r => r.id === id);
  },

  // Supprimer un enregistrement
  deleteRecord: function(type, id) {
    const records = this.loadRecords(type);
    const filtered = records.filter(r => r.id !== id);
    return this.saveRecords(type, filtered);
  },

  // Obtenir les enregistrements d'une classe
  getClassRecords: function(type, classKey) {
    const records = this.loadRecords(type);
    
    // Pour les classes avec options (1ère, 2ème, 3ème, 4ème), on filtre exact
    // car chaque option a sa propre page (MA, HP, CG, etc.)
    return records.filter(r => r.classKey === classKey);
  }
};

// Fonction pour générer un ID unique
if (typeof generateId === 'undefined') {
  function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
