// Test file untuk memverifikasi logic scheduling
// Jalankan di browser console untuk test

// Mock data untuk testing
const testIbadahTypes = [
  {
    id: '1',
    name: 'Selalu Aktif',
    schedule_type: 'always'
  },
  {
    id: '2', 
    name: 'Rentang Tanggal',
    schedule_type: 'date_range',
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  },
  {
    id: '3',
    name: 'Tanggal Tertentu',
    schedule_type: 'specific_dates',
    specific_dates: ['2024-12-25', '2024-12-26']
  },
  {
    id: '4',
    name: 'Tanggal Tertentu Hari Ini',
    schedule_type: 'specific_dates',
    specific_dates: [new Date().toISOString().split('T')[0]] // Hari ini
  }
];

// Function untuk test (copy dari database.ts)
function isIbadahActiveOnDate(ibadahType, targetDate) {
  const scheduleType = ibadahType.schedule_type || 'always';
  const target = new Date(targetDate);

  switch (scheduleType) {
    case 'always':
      return true;

    case 'date_range':
      if (!ibadahType.start_date || !ibadahType.end_date) return true;
      const startDate = new Date(ibadahType.start_date);
      const endDate = new Date(ibadahType.end_date);
      return target >= startDate && target <= endDate;

    case 'specific_dates':
      if (!ibadahType.specific_dates || !Array.isArray(ibadahType.specific_dates)) return false;
      return ibadahType.specific_dates.some((date) => {
        const specificDate = new Date(date);
        return specificDate.toDateString() === target.toDateString();
      });

    case 'ramadhan_auto':
      return ibadahType.is_ramadhan_only || false;

    default:
      return true;
  }
}

// Test function
function testSchedulingLogic() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  console.log('=== TEST SCHEDULING LOGIC ===');
  console.log('Today:', today);
  console.log('Tomorrow:', tomorrowStr);
  console.log('');
  
  testIbadahTypes.forEach(ibadah => {
    const activeToday = isIbadahActiveOnDate(ibadah, today);
    const activeTomorrow = isIbadahActiveOnDate(ibadah, tomorrowStr);
    
    console.log(`${ibadah.name}:`);
    console.log(`  Schedule Type: ${ibadah.schedule_type}`);
    console.log(`  Active Today: ${activeToday}`);
    console.log(`  Active Tomorrow: ${activeTomorrow}`);
    
    if (ibadah.schedule_type === 'date_range') {
      console.log(`  Date Range: ${ibadah.start_date} to ${ibadah.end_date}`);
    }
    if (ibadah.schedule_type === 'specific_dates') {
      console.log(`  Specific Dates: ${ibadah.specific_dates.join(', ')}`);
    }
    console.log('');
  });
  
  // Expected results
  console.log('=== EXPECTED RESULTS ===');
  console.log('Selalu Aktif: Should be active today and tomorrow');
  console.log('Rentang Tanggal: Should be active today and tomorrow (2024 range)');
  console.log('Tanggal Tertentu: Should be INACTIVE today and tomorrow (Christmas dates)');
  console.log('Tanggal Tertentu Hari Ini: Should be ACTIVE today, INACTIVE tomorrow');
}

// Jalankan test
testSchedulingLogic();

// Instructions untuk user:
console.log('');
console.log('=== CARA MENGGUNAKAN ===');
console.log('1. Copy paste kode ini ke Browser Console (F12)');
console.log('2. Lihat hasil test di console');
console.log('3. Bandingkan dengan expected results');
console.log('4. Jika logic benar, test di aplikasi dengan membuat ibadah baru');
