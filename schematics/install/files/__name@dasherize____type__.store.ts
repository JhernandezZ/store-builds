import { State } from "@ngxs/store";
import { <%= classify(name) %> Service } from "./<%= dasherize(name) %>.service"
export class <%= classify(name) %> Model {
  loading: boolean;
  loaded: boolean;
}

@State<<%= classify(name) %>Model > ({
  name: '<%=name%>',
  defaults: {
    loading: false,
    loaded: false
  }
})
export class <%= classify(name) %>State {
  constructor(private <%= name %>Service: <%= classify(name) %>Service){}
}
