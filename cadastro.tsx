import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function Cadastro() {
  const [nome,setNome]=useState('');
  const [email,setEmail]=useState('');
  const [senha,setSenha]=useState('');

  async function cadastrar(){
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options:{ data:{ nome } }
    });

    if(error) return Alert.alert('Erro', error.message);

    router.push('/cadastro-vendedor');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>
      <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome}/>
      <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail}/>
      <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha}/>
      <TouchableOpacity style={styles.button} onPress={cadastrar}>
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles=StyleSheet.create({container:{flexGrow:1,justifyContent:'center',padding:24,backgroundColor:'#0b0503'},title:{fontSize:28,color:'#fff',fontWeight:'bold',marginBottom:20},input:{backgroundColor:'#1a1210',padding:14,borderRadius:10,color:'#fff',marginBottom:12},button:{backgroundColor:'#c0392b',padding:16,borderRadius:10},buttonText:{color:'#fff',textAlign:'center',fontWeight:'bold'}});
