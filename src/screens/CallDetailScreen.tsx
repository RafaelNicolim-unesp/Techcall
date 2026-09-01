import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, ALUNO_ID } from '../firebase/config';

type Chamado = {
  description: string;
  photoUri?: string | null;
  address?: string | null;
  status: string;
};

export default function CallDetailScreen({ route }: any) {
  const { chamadoId } = route.params;
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function carregarChamado() {
      setLoading(true);
      try {
        const docRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          setChamado(snapshot.data() as Chamado);
        } else {
          Alert.alert('Erro', 'Chamado não encontrado.');
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do chamado.');
      } finally {
        setLoading(false);
      }
    }

    carregarChamado();
  }, [chamadoId]);

  async function mudarStatus(novoStatus: string) {
    setUpdating(true);
    try {
      const docRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);
      await updateDoc(docRef, { status: novoStatus });

      setChamado((prev) => (prev ? { ...prev, status: novoStatus } : null));
      Alert.alert('Sucesso', `Status alterado para "${novoStatus}".`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status do chamado.');
    } finally {
      setUpdating(false);
    }
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case 'aberto':
        return styles.status_aberto;
      case 'atendendo':
        return styles.status_atendendo;
      case 'concluido':
        return styles.status_concluido;
      case 'cancelado':
        return styles.status_cancelado;
      default:
        return {};
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  if (!chamado) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Chamado não localizado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <Text style={styles.sectionLabel}>Status atual:</Text>
        <View style={[styles.statusBadge, getStatusStyle(chamado.status)]}>
          <Text style={styles.statusText}>{chamado.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Descrição</Text>
        <Text style={styles.valueText}>{chamado.description}</Text>
      </View>

      {chamado.address ? (
        <View style={styles.card}>
          <Text style={styles.label}>Localização</Text>
          <Text style={styles.valueText}>{chamado.address}</Text>
        </View>
      ) : null}

      {chamado.photoUri ? (
        <View style={styles.card}>
          <Text style={styles.label}>Foto anexada</Text>
          <Image source={{ uri: chamado.photoUri }} style={styles.photo} />
        </View>
      ) : null}

      <View style={styles.actionsContainer}>
        {updating && (
          <ActivityIndicator size="small" color="#1565c0" style={{ marginBottom: 12 }} />
        )}

        {chamado.status === 'aberto' && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.startBtn, updating && styles.disabledBtn]}
              onPress={() => mudarStatus('atendendo')}
              disabled={updating}
            >
              <Text style={styles.buttonText}>Iniciar Atendimento</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelBtn, updating && styles.disabledBtn]}
              onPress={() => mudarStatus('cancelado')}
              disabled={updating}
            >
              <Text style={styles.buttonText}>Cancelar Chamado</Text>
            </TouchableOpacity>
          </View>
        )}

        {chamado.status === 'atendendo' && (
          <TouchableOpacity
            style={[styles.button, styles.completeBtn, updating && styles.disabledBtn]}
            onPress={() => mudarStatus('concluido')}
            disabled={updating}
          >
            <Text style={styles.buttonText}>Concluir Atendimento</Text>
          </TouchableOpacity>
        )}

        {(chamado.status === 'concluido' || chamado.status === 'cancelado') && (
          <View style={styles.finalizedBox}>
            <Text style={styles.finalizedText}>
              Este chamado foi {chamado.status === 'concluido' ? 'concluído' : 'cancelado'} e não permite novas ações.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: '#666' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  status_aberto: { backgroundColor: '#e65100' },
  status_atendendo: { backgroundColor: '#1565c0' },
  status_concluido: { backgroundColor: '#2e7d32' },
  status_cancelado: { backgroundColor: '#c62828' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 6 },
  valueText: { fontSize: 15, color: '#333', lineHeight: 22 },
  photo: { width: '100%', height: 200, borderRadius: 8, marginTop: 8 },
  actionsContainer: { marginTop: 10 },
  buttonGroup: { gap: 12 },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  startBtn: { backgroundColor: '#1565c0' },
  cancelBtn: { backgroundColor: '#c62828' },
  completeBtn: { backgroundColor: '#2e7d32' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  finalizedBox: {
    padding: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  finalizedText: { color: '#666', fontWeight: '600', textAlign: 'center' },
});