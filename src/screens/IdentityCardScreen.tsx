import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {getUserData} from '../services/storage';

interface UserData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: number; // 1=male, 2=female, 3=other
  dateOfBirth?: string;
  phoneNumber?: string;
  alternateNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  [key: string]: any;
}

interface IdentityCardScreenProps {
  route: {
    params?: {
      userData?: UserData;
    };
  };
}

const IdentityCardScreen: React.FC<IdentityCardScreenProps> = ({route}) => {
  const [userData, setUserData] = React.useState<UserData | null>(
    route.params?.userData || null,
  );

  React.useEffect(() => {
    // If userData not passed via route, get it from storage
    if (!userData) {
      loadUserData();
    }
  }, []);

  const loadUserData = async () => {
    try {
      const storedData = await getUserData();
      if (storedData) {
        setUserData(storedData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getGenderText = (gender?: number): string => {
    if (gender === undefined || gender === null) return '';
    switch (gender) {
      case 1:
        return 'Male';
      case 2:
        return 'Female';
      case 3:
        return 'Other';
      default:
        return '';
    }
  };

  const getFullName = (): string => {
    const parts = [];
    if (userData?.firstName) parts.push(userData.firstName);
    if (userData?.lastName) parts.push(userData.lastName);
    return parts.length > 0 ? parts.join(' ') : '';
  };

  const renderField = (label: string, value: string | undefined | null) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    );
  };

  if (!userData) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.errorText}>No user data available</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Identity Card</Text>
        <View style={styles.divider} />

        {renderField('Name', getFullName())}
        {renderField('First Name', userData.firstName)}
        {renderField('Last Name', userData.lastName)}
        {renderField('Email', userData.email)}
        {renderField('Gender', getGenderText(userData.gender))}
        {renderField('Date of Birth', userData.dateOfBirth)}
        {renderField('Phone Number', userData.phoneNumber)}
        {renderField('Alternate Number', userData.alternateNumber)}
        {renderField('City', userData.city)}
        {renderField('State', userData.state)}
        {renderField('Country', userData.country)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});

export default IdentityCardScreen;

