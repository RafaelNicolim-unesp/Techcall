import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, ALUNO_ID } from '../firebase/config';

type Chamado = {
  id: string;
  description: string;
  status: string;
  address?: string | null;
  photoUri?: string | null;
};

export default function CallListScreen({ navigation }: any) {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);

  const buscarChamados = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'alunos', ALUNO_ID, 'chamados'),
        orderBy('criadoEm', 'desc')
      );
      const snapshot = await getDocs(q);
      const lista: Chamado[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Chamado, 'id'>),
      }));
      setChamados(lista);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      buscarChamados();
    }, [buscarChamados])
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'aberto':
        return '#e65100';
      case 'atendendo':
        return '#1565c0';
      case 'concluido':
        return '#2e7d32';
      case 'cancelado':
        return '#c62828';
      default:
        return '#999';
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TouchableOpacity
        style={styles.newCallButton}
        onPress={() => navigation.navigate('NewCall')}
      >
        <Text style={styles.newCallButtonText}>+ Criar Novo Chamado</Text>
      </TouchableOpacity>

      <FlatList
        data={chamados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum chamado encontrado.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CallDetail', { chamadoId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.description}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            {item.address && (
              <Text style={styles.addressText} numberOfLines={1}>
                📍 {item.address}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  newCallButton: {
    backgroundColor: '#1565c0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  newCallButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContent: { paddingBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  addressText: { fontSize: 12, color: '#666', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
});