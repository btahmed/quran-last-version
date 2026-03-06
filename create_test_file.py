import pandas as pd
from datetime import datetime

# Create test data with unique username
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
df = pd.DataFrame([{
    'Prénom': 'Test',
    'Nom': 'User',
    'Username': f'testuser_{timestamp}',
    'Email': 'test@example.com',
    'Classe': 'Test'
}])

df.to_excel('test_import.xlsx', index=False)
print(f'Test file created with username: testuser_{timestamp}')
