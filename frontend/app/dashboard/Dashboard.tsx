import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";
import BaseScreen from "../../components/BaseScreen";

const Dashboard = () => {
  return (
    <BaseScreen>
      <View style={tw`flex-1 `}>
        <Text>Hello World</Text>
      </View>
    </BaseScreen>
  );
};

export default Dashboard;
