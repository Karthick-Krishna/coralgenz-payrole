fetch('http://localhost:3000/api/employees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeData: {
      firstName: 'Test',
      lastName: 'AdminRole',
      email: 'test.adminrole@coralgenz.co.in'
    },
    portalRole: 'manager'
  })
}).then(res => res.json()).then(console.log);
