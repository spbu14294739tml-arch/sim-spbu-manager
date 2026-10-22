const InputField = ({ label, name, type = "text", placeholder = "", formData, setFormData }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      value={formData[name] || ''}
      onChange={(e) => {
        // Jika tipenya email atau link, biarkan huruf kecil. Jika teks biasa, jadikan KAPITAL.
        const isEmailOrLink = name === 'email' || name.includes('link');
        const nilaiBaru = isEmailOrLink ? e.target.value : e.target.value.toUpperCase();
        setFormData({...formData, [name]: nilaiBaru});
      }}
      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder={placeholder}
    />
  </div>
);