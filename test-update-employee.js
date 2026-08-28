fetch('http://localhost:3000/api/employees/CGG-EMP-0001', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'UpdatedName'
  })
}).then(res => res.json()).then(console.log);
