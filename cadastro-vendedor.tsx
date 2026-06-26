import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function CadastroVendedor() {
  const [loja,setLoja]=useState('');
  const [categoria,setCategoria]=useState('');
  const [produto,setProduto]=useState('');
  const [produtos,setProdutos]=useState<string[]>([]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastro da Loja</Text>

      <TextInput style={styles.input} placeholder="Nome da Loja" value={loja} onChangeText={setLoja}/>
      <TextInput style={styles.input} placeholder="Categoria" value={categoria} onChangeText={setCategoria}/>

      <Text style={styles.sub}>Cardápio</Text>
      <TextInput style={styles.input} placeholder="Nome do Produto" value={produto} onChangeText={setProduto}/>

      <TouchableOpacity style={styles.button} onPress={()=>{
        if(produto){
          setProdutos([...produtos,produto]);
          setProduto('');
        }
      }}>
        <Text style={styles.buttonText}>Adicionar Item</Text>
      </TouchableOpacity>

      {produtos.map((p,i)=><Text key={i} style={styles.item}>• {p}</Text>)}

      <TouchableOpacity style={[styles.button,{marginTop:20}]} onPress={()=>router.replace('/(tabs)')}>
        <Text style={styles.buttonText}>Finalizar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles=StyleSheet.create({container:{flexGrow:1,padding:24,backgroundColor:'#0b0503'},title:{fontSize:28,color:'#fff',fontWeight:'bold',marginBottom:20},sub:{color:'#fff',fontSize:18,marginVertical:10},input:{backgroundColor:'#1a1210',padding:14,borderRadius:10,color:'#fff',marginBottom:12},button:{backgroundColor:'#c0392b',padding:16,borderRadius:10},buttonText:{color:'#fff',textAlign:'center',fontWeight:'bold'},item:{color:'#fff',marginTop:8}});
