import {
  KeyboardTypeOptions,
  TextInput,
  TextInputProps,
  useColorScheme,
  View,
} from 'react-native';
import Text from '../../../screen/Common/CustomText';
import { spacerM, spacerS } from './Spacers';
import { subTitle } from './Titles';
import { NEUTRAL_200 } from '../lib/colours';
import { getBlackColour } from '../../../lib/graphics/utils';
import { RefObject } from 'react';

type FieldTypeConfig = {
  textContentType: TextInputProps['textContentType'];
  autoComplete: TextInputProps['autoComplete'];
  keyboardType: KeyboardTypeOptions;
  isPassword: boolean;
  autoCapitalize: TextInputProps['autoCapitalize'];
};

export const FieldType = {
  Email: {
    textContentType: 'emailAddress',
    autoComplete: 'email',
    keyboardType: 'email-address',
    isPassword: false,
    autoCapitalize: 'none',
  },
  Password: {
    textContentType: 'password',
    autoComplete: 'password',
    keyboardType: 'default',
    isPassword: true,
    autoCapitalize: 'none',
  },
  Default: {
    textContentType: 'none',
    autoComplete: 'off',
    keyboardType: 'default',
    isPassword: false,
    autoCapitalize: 'sentences',
  },
} as const satisfies Record<string, FieldTypeConfig>;

type FieldProps = {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: ((ref: RefObject<TextInput> | undefined) => void);
  fieldType?: FieldTypeConfig;
  testID?: string;
  ref?: RefObject<any>;
};

const Field = (props: FieldProps) => {
  const {
    label,
    placeholder,
    value,
    onChangeText,
    onFocus,
    fieldType = FieldType.Default,
    testID,
    ref,
  } = props;

  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View
      style={{
        gap: spacerS,
      }}
    >
      {label && <Text style={subTitle}>{label}</Text>}
      {/* <KelecCard> */}
      <View
        style={{
          padding: spacerM,
          borderColor: NEUTRAL_200,
          borderWidth: 1,
          borderRadius: spacerS,
        }}
      >
        <TextInput
          ref={ref}
          importantForAutofill={'yes'}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          textContentType={fieldType.textContentType}
          autoComplete={fieldType.autoComplete}
          secureTextEntry={fieldType.isPassword}
          keyboardType={fieldType.keyboardType}
          autoCapitalize={fieldType.autoCapitalize}
          testID={testID}
          onFocus={() => onFocus?.(ref)}
          style={{
            color: getBlackColour(isDarkMode),
          }}
        />
      </View>
      {/* </KelecCard> */}
    </View>
  );
};

export default Field;
