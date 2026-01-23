/*
 * Интерфейс для элемента, который можно сортировать
 */
export interface ISortable {
  getValue(): number;
  toString(): string;
}

/*
 * Интерфейс наблюдателя для паттерна Observer
 */
export interface IObserver<T> {
  update(event: SortingEvent<T>): void;
}

/*
 * Интерфейс субъекта для паттерна Observer
 */
export interface ISubject<T> {
  attach(observer: IObserver<T>): void;
  detach(observer: IObserver<T>): void;
  notify(event: SortingEvent<T>): void;
}

/*
 * Типы событий сортировки
 */
export enum EventType {
  STARTED = 'STARTED',
  ELEMENT_SORTED = 'ELEMENT_SORTED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

/*
 * Интерфейс события сортировки
 */
export interface SortingEvent<T> {
  type: EventType;
  element?: T;
  index?: number;
  timestamp: number;
  delay?: number;
  metadata?: Record<string, any>;
}

/*
 * Интерфейс стратегии сортировки
 */
export interface ISortingStrategy<T extends ISortable> {
  sort(array: T[], context: SortingContext<T>): Promise<T[]>;
  getName(): string;
  getDescription(): string;
}

/*
 * Интерфейс для фабрики стратегий
 */
export interface ISortingStrategyFactory<T extends ISortable> {
  createStrategy(type: StrategyType): ISortingStrategy<T>;
  registerStrategy(type: StrategyType, strategy: ISortingStrategy<T>): void;
  listAvailableStrategies(): string[];
}

/*
 * Типы стратегий сортировки
 */
export enum StrategyType {
  DEFAULT = 'DEFAULT'
}

/*
 * Конфигурация сортировки
 */
export interface SortingConfig {
  baseDelayMs: number;
  enableLogging: boolean;
  logPrefix: string;
  showTimestamps: boolean;
  colorize: boolean;
}

/*
 * Обёртка для числового значения с поддержкой сортировки
 */
export class SortableNumber implements ISortable {
  constructor(private readonly value: number) {}

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return `${this.value}`;
  }

  toDetailedString(): string {
    return `SortableNumber(${this.value})`;
  }
}

/*
 * Синглтон для управления глобальной конфигурацией
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: SortingConfig;

  private constructor() {
    this.config = {
      baseDelayMs: 1000,
      enableLogging: true,
      logPrefix: '🎯',
      showTimestamps: false,
      colorize: true
    };
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  getConfig(): Readonly<SortingConfig> {
    return Object.freeze({ ...this.config });
  }

  updateConfig(partial: Partial<SortingConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  resetToDefaults(): void {
    this.config = {
      baseDelayMs: 1000,
      enableLogging: true,
      logPrefix: '🎯',
      showTimestamps: false,
      colorize: true
    };
  }
}

/*
 * Декоратор для измерения времени выполнения метода
 */
function Measure(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    
    if (result && typeof result.then === 'function') {
      return result.then((res: any) => {
        const end = performance.now();
        console.log(`${propertyKey} completed in ${(end - start).toFixed(2)}ms`);
        return res;
      });
    }
    
    const end = performance.now();
    console.log(`${propertyKey} executed in ${(end - start).toFixed(2)}ms`);
    return result;
  };

  return descriptor;
}

/*
 * Декоратор для логирования вызовов методов
 */
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const config = ConfigurationManager.getInstance().getConfig();
    if (config.enableLogging) {
      console.log(`Calling ${propertyKey} with ${args.length} argument(s)`);
    }
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

/*
 * Декоратор для валидации аргументов
 */
function ValidateArray(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const array = args[0];
    if (!Array.isArray(array)) {
      throw new TypeError(`${propertyKey} expects an array as first argument`);
    }
    if (array.length === 0) {
      throw new Error(`${propertyKey} cannot work with empty array`);
    }
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

/*
 * Контекст сортировки, реализующий паттерн Subject
 */
export class SortingContext<T extends ISortable> implements ISubject<T> {
  private observers: Set<IObserver<T>> = new Set();
  private eventHistory: SortingEvent<T>[] = [];
  private elementCount: number = 0;

  constructor(private strategyName: string) {}

  attach(observer: IObserver<T>): void {
    this.observers.add(observer);
  }

  detach(observer: IObserver<T>): void {
    this.observers.delete(observer);
  }

  notify(event: SortingEvent<T>): void {
    this.eventHistory.push(event);
    this.observers.forEach(observer => observer.update(event));
  }

  emitStarted(): void {
    const event: SortingEvent<T> = {
      type: EventType.STARTED,
      timestamp: Date.now(),
      metadata: { strategy: this.strategyName }
    };
    this.notify(event);
  }

  emitElementSorted(element: T, index: number, delay: number): void {
    this.elementCount++;
    const event: SortingEvent<T> = {
      type: EventType.ELEMENT_SORTED,
      element,
      index,
      timestamp: Date.now(),
      delay,
      metadata: { totalSorted: this.elementCount }
    };
    this.notify(event);
  }

  emitCompleted(): void {
    const event: SortingEvent<T> = {
      type: EventType.COMPLETED,
      timestamp: Date.now(),
      metadata: { 
        strategy: this.strategyName,
        totalElements: this.elementCount
      }
    };
    this.notify(event);
  }

  emitError(error: Error): void {
    const event: SortingEvent<T> = {
      type: EventType.ERROR,
      timestamp: Date.now(),
      metadata: { error: error.message }
    };
    this.notify(event);
  }

  getEventHistory(): SortingEvent<T>[] {
    return [...this.eventHistory];
  }

  getElementCount(): number {
    return this.elementCount;
  }

  getStrategyName(): string {
    return this.strategyName;
  }
}

/*
 * Наблюдатель для логирования событий в консоль
 */
export class ConsoleLoggingObserver<T extends ISortable> implements IObserver<T> {
  private config = ConfigurationManager.getInstance().getConfig();

  update(event: SortingEvent<T>): void {
    if (!this.config.enableLogging) return;

    const timestamp = this.config.showTimestamps 
      ? `[${new Date(event.timestamp).toISOString()}] ` 
      : '';

    switch (event.type) {
      case EventType.STARTED:
        console.log(`\n${this.config.logPrefix} ${timestamp}Sorting started: ${event.metadata?.strategy}`);
        break;

      case EventType.ELEMENT_SORTED:
        const delayInfo = event.delay ? ` (delay: ${event.delay}ms)` : '';
        console.log(`${this.config.logPrefix} ${timestamp}Element ${event.element?.getValue()} added to result${delayInfo}`);
        break;

      case EventType.COMPLETED:
        console.log(`${this.config.logPrefix} ${timestamp}Sorting completed: ${event.metadata?.totalElements} elements\n`);
        break;

      case EventType.ERROR:
        console.error(`${this.config.logPrefix} ${timestamp}Error: ${event.metadata?.error}`);
        break;
    }
  }
}

/*
 * Наблюдатель для сбора статистики
 */
export class StatisticsObserver<T extends ISortable> implements IObserver<T> {
  private startTime: number = 0;
  private endTime: number = 0;
  private sortedElements: number = 0;
  private totalDelay: number = 0;
  private events: Map<EventType, number> = new Map();

  update(event: SortingEvent<T>): void {
    const currentCount = this.events.get(event.type) || 0;
    this.events.set(event.type, currentCount + 1);

    switch (event.type) {
      case EventType.STARTED:
        this.startTime = event.timestamp;
        break;

      case EventType.ELEMENT_SORTED:
        this.sortedElements++;
        if (event.delay) {
          this.totalDelay += event.delay;
        }
        break;

      case EventType.COMPLETED:
        this.endTime = event.timestamp;
        break;
    }
  }

  getStatistics(): SortingStatistics {
    return {
      duration: this.endTime - this.startTime,
      sortedElements: this.sortedElements,
      totalDelay: this.totalDelay,
      averageDelay: this.sortedElements > 0 ? this.totalDelay / this.sortedElements : 0,
      eventCounts: new Map(this.events)
    };
  }

  printStatistics(): void {
    const stats = this.getStatistics();
    console.log('\n📊 Sorting Statistics:');
    console.log(`   Duration: ${stats.duration.toFixed(2)}ms`);
    console.log(`   Elements Sorted: ${stats.sortedElements}`);
    console.log(`   Total Delay: ${stats.totalDelay}ms`);
    console.log(`   Average Delay: ${stats.averageDelay.toFixed(2)}ms`);
    console.log('   Event Counts:');
    stats.eventCounts.forEach((count, type) => {
      console.log(`      ${type}: ${count}`);
    });
  }

  reset(): void {
    this.startTime = 0;
    this.endTime = 0;
    this.sortedElements = 0;
    this.totalDelay = 0;
    this.events.clear();
  }
}

export interface SortingStatistics {
  duration: number;
  sortedElements: number;
  totalDelay: number;
  averageDelay: number;
  eventCounts: Map<EventType, number>;
}

/*
 * Наблюдатель для записи истории сортировки
 */
export class HistoryObserver<T extends ISortable> implements IObserver<T> {
  private history: Array<{
    event: SortingEvent<T>;
    formattedTime: string;
  }> = [];

  update(event: SortingEvent<T>): void {
    this.history.push({
      event,
      formattedTime: new Date(event.timestamp).toLocaleTimeString()
    });
  }

  getHistory(): Array<{ event: SortingEvent<T>; formattedTime: string }> {
    return [...this.history];
  }

  printHistory(): void {
    console.log('\n📜 Sorting History:');
    this.history.forEach(({ event, formattedTime }, index) => {
      console.log(`   ${index + 1}. [${formattedTime}] ${event.type}${event.element ? ` - ${event.element.getValue()}` : ''}`);
    });
  }

  clear(): void {
    this.history = [];
  }
}

/*
 * Абстрактная базовая стратегия сортировки
 */
export abstract class AbstractSortingStrategy<T extends ISortable> 
  implements ISortingStrategy<T> {
  
  abstract sort(array: T[], context: SortingContext<T>): Promise<T[]>;
  abstract getName(): string;
  abstract getDescription(): string;

  protected getConfig(): Readonly<SortingConfig> {
    return ConfigurationManager.getInstance().getConfig();
  }
}

/*
 * Стандартная стратегия сортировки
 */
export class DefaultStrategy<T extends ISortable> 
  extends AbstractSortingStrategy<T> {

  @Log
  @ValidateArray
  @Measure
  sort(array: T[], context: SortingContext<T>): Promise<T[]> {
    return new Promise((resolve, reject) => {
      context.emitStarted();

      const result: T[] = [];
      let completedCount = 0;
      const totalElements = array.length;

      try {
        array.forEach((element, index) => {
          const delayMs = element.getValue();
          
          setTimeout(() => {
            // Добавляем элемент в результирующий массив
            result.push(element);
            
            console.log(`Added to result array: ${element.getValue()}`);
            
            // Уведомление наблюдателей
            context.emitElementSorted(element, index, delayMs);
            
            completedCount++;
            
            // Если все элементы обработаны, завершаем Promise
            if (completedCount === totalElements) {
              context.emitCompleted();
              resolve(result);
            }
          }, delayMs);
        });

      } catch (error) {
        context.emitError(error as Error);
        reject(error);
      }
    });
  }

  getName(): string {
    return 'Default Fast Strategy (Sleep Sort)';
  }

  getDescription(): string {
    return 'Sorts array using blazing fast algorithm. Elements are added to result array in order of completion.';
  }
}

/*
 * Конкретная фабрика стратегий сортировки
 */
export class ConcreteSortingStrategyFactory<T extends ISortable>
  implements ISortingStrategyFactory<T> {
  
  private strategies: Map<StrategyType, ISortingStrategy<T>> = new Map();

  constructor() {
    this.registerStrategy(
      StrategyType.DEFAULT,
      new DefaultStrategy<T>()
    );
  }

  createStrategy(type: StrategyType): ISortingStrategy<T> {
    const strategy = this.strategies.get(type);
    
    if (!strategy) {
      throw new Error(
        `Strategy type '${type}' not found. Available: ${this.listAvailableStrategies().join(', ')}`
      );
    }

    return strategy;
  }

  registerStrategy(type: StrategyType, strategy: ISortingStrategy<T>): void {
    this.strategies.set(type, strategy);
  }

  listAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  hasStrategy(type: StrategyType): boolean {
    return this.strategies.has(type);
  }
}

/*
 * Построитель для создания сортировщика
 */
export class SorterBuilder<T extends ISortable> {
  private array?: T[];
  private strategy?: ISortingStrategy<T>;
  private observers: IObserver<T>[] = [];
  private config?: Partial<SortingConfig>;
  private enableDefaultObservers: boolean = true;

  setArray(array: T[]): this {
    this.array = array;
    return this;
  }

  setStrategy(strategy: ISortingStrategy<T>): this {
    this.strategy = strategy;
    return this;
  }

  addObserver(observer: IObserver<T>): this {
    this.observers.push(observer);
    return this;
  }

  setConfig(config: Partial<SortingConfig>): this {
    this.config = config;
    return this;
  }

  disableDefaultObservers(): this {
    this.enableDefaultObservers = false;
    return this;
  }

  build(): ArraySorter<T> {
    if (!this.array) {
      throw new Error('Array is required to build sorter');
    }
    if (!this.strategy) {
      throw new Error('Strategy is required to build sorter');
    }

    // Обновление конфигурации
    if (this.config) {
      ConfigurationManager.getInstance().updateConfig(this.config);
    }

    const sorter = new ArraySorter(this.array, this.strategy);

    // Добавление наблюдателей по умолчанию
    if (this.enableDefaultObservers) {
      sorter.addObserver(new ConsoleLoggingObserver<T>());
    }

    // Добавление пользовательских наблюдателей
    this.observers.forEach(observer => sorter.addObserver(observer));

    return sorter;
  }

  reset(): this {
    this.array = undefined;
    this.strategy = undefined;
    this.observers = [];
    this.config = undefined;
    this.enableDefaultObservers = true;
    return this;
  }
}


/*
 * Основной класс (фасад) сортировщика массива
 */
export class ArraySorter<T extends ISortable> {
  private context: SortingContext<T>;

  constructor(
    private array: T[],
    private strategy: ISortingStrategy<T>
  ) {
    this.context = new SortingContext(strategy.getName());
  }

  addObserver(observer: IObserver<T>): void {
    this.context.attach(observer);
  }

  removeObserver(observer: IObserver<T>): void {
    this.context.detach(observer);
  }

  @Measure
  async execute(): Promise<T[]> {
    console.log('\n' + '='.repeat(70));
    console.log(`🔄 ${this.strategy.getName()}`);
    console.log('='.repeat(70));
    console.log(`📝 ${this.strategy.getDescription()}`);
    console.log(`📥 Input array: [${this.array.map(x => x.getValue()).join(', ')}]`);
    console.log('='.repeat(70));

    const result = await this.strategy.sort([...this.array], this.context);
    
    console.log('\n' + '='.repeat(70));
    console.log(`✅ Sorted result: [${result.map(x => x.getValue()).join(', ')}]`);
    console.log('='.repeat(70));
    
    return result;
  }

  getContext(): SortingContext<T> {
    return this.context;
  }

  getEventHistory(): SortingEvent<T>[] {
    return this.context.getEventHistory();
  }
}

/*
 * Интерфейс команды управления сортировкой
 */
export interface ICommand {
  execute(): Promise<any>;
  getDescription(): string;
}

/*
 * Команда для запуска сортировки
 */
export class ExecuteSortingCommand<T extends ISortable> implements ICommand {
  constructor(private sorter: ArraySorter<T>) {}

  async execute(): Promise<T[]> {
    return await this.sorter.execute();
  }

  getDescription(): string {
    return 'Execute array sorting';
  }
}

/*
 * Команда для обновления конфигурации
 */
export class UpdateConfigCommand implements ICommand {
  constructor(private config: Partial<SortingConfig>) {}

  async execute(): Promise<void> {
    ConfigurationManager.getInstance().updateConfig(this.config);
    console.log('✅ Configuration updated');
  }

  getDescription(): string {
    return 'Update sorting configuration';
  }
}

/*
 * Invoker для команд
 */
export class CommandInvoker {
  private commandQueue: ICommand[] = [];
  private executedCommands: ICommand[] = [];

  enqueueCommand(command: ICommand): void {
    this.commandQueue.push(command);
  }

  async executeNext(): Promise<any> {
    const command = this.commandQueue.shift();
    if (command) {
      console.log(`\n🔧 Executing: ${command.getDescription()}`);
      const result = await command.execute();
      this.executedCommands.push(command);
      return result;
    }
  }

  async executeAll(): Promise<any[]> {
    const results = [];
    while (this.commandQueue.length > 0) {
      const result = await this.executeNext();
      results.push(result);
    }
    return results;
  }

  getQueueSize(): number {
    return this.commandQueue.length;
  }

  clearQueue(): void {
    this.commandQueue = [];
  }

  getExecutedCommands(): ICommand[] {
    return [...this.executedCommands];
  }
}

/*
 * Абстрактный класс с шаблонным методом для запуска сортировки
 */
export abstract class AbstractSortingRunner<T extends ISortable> {
  async run(array: T[], strategyType: StrategyType): Promise<T[]> {
    this.beforeRun();
    
    const factory = new ConcreteSortingStrategyFactory<T>();
    const strategy = factory.createStrategy(strategyType);
    
    const builder = new SorterBuilder<T>();
    const sorter = this.buildSorter(builder, array, strategy);
    
    const result = await this.executeSorting(sorter);
    
    this.afterRun();
    
    return result;
  }

  protected abstract beforeRun(): void;
  protected abstract afterRun(): void;

  protected buildSorter(
    builder: SorterBuilder<T>,
    array: T[],
    strategy: ISortingStrategy<T>
  ): ArraySorter<T> {
    return builder
      .setArray(array)
      .setStrategy(strategy)
      .build();
  }

  protected async executeSorting(sorter: ArraySorter<T>): Promise<T[]> {
    return await sorter.execute();
  }
}

/*
 * Конкретный runner с логированием
 */
export class LoggingSortingRunner<T extends ISortable> 
  extends AbstractSortingRunner<T> {
  
  protected beforeRun(): void {
    console.log('\n🚀 Starting sorting process...');
  }

  protected afterRun(): void {
    console.log('\n✅ Sorting process completed.');
  }
}


export async function demonstrateSorting(): Promise<void> {
  // Настройка конфигурации
  ConfigurationManager.getInstance().updateConfig({
    enableLogging: true,
    logPrefix: '> ',
    showTimestamps: false
  });

  console.log('\n' + '='.repeat(70));
  console.log('🎨 ARRAY SORTING USING');
  console.log('='.repeat(70));

  const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
  const sortableArray = numbers.map(n => new SortableNumber(n));

  console.log(`\n📥 Input array: [${numbers.join(', ')}]`);

  // Создание фабрики стратегий
  const factory = new ConcreteSortingStrategyFactory<SortableNumber>();
  const strategy = factory.createStrategy(StrategyType.DEFAULT);

  // Создание наблюдателей
  const statisticsObserver = new StatisticsObserver<SortableNumber>();
  const historyObserver = new HistoryObserver<SortableNumber>();

  // Использование Builder для создания сортировщика
  const builder = new SorterBuilder<SortableNumber>();
  const sorter = builder
    .setArray(sortableArray)
    .setStrategy(strategy)
    .addObserver(statisticsObserver)
    .addObserver(historyObserver)
    .build();

  // Использование Command для выполнения
  const invoker = new CommandInvoker();
  const sortingCommand = new ExecuteSortingCommand(sorter);
  
  invoker.enqueueCommand(sortingCommand);
  const results = await invoker.executeAll();
  
  const sortedArray = results[0] as SortableNumber[];
  
  console.log('\n' + '─'.repeat(70));
  console.log(`\n📊 Final sorted array: [${sortedArray.map(x => x.getValue()).join(', ')}]`);
  
  // Вывод статистики
  setTimeout(() => {
    console.log('\n' + '─'.repeat(70));
    statisticsObserver.printStatistics();
    historyObserver.printHistory();
    console.log('\n' + '='.repeat(70));
    console.log('✅ DEMONSTRATION COMPLETED');
    console.log('='.repeat(70) + '\n');
  }, 100);
}

/*
 * Пример с использованием Template Method Pattern
 */
export async function demonstrateWithTemplateMethod(): Promise<void> {
  const numbers = [5, 2, 8, 1, 9];
  const sortableArray = numbers.map(n => new SortableNumber(n));

  const runner = new LoggingSortingRunner<SortableNumber>();
  const sortedArray = await runner.run(sortableArray, StrategyType.DEFAULT);
  
  console.log(`\n✅ Template Method result: [${sortedArray.map(x => x.getValue()).join(', ')}]`);
}

/*
 * Пример с кастомной конфигурацией
 */
export async function demonstrateWithCustomConfig(): Promise<void> {
  const numbers = [10, 5, 15, 3, 20];
  const sortableArray = numbers.map(n => new SortableNumber(n));

  // Обновление конфигурации через Command
  const invoker = new CommandInvoker();
  const configCommand = new UpdateConfigCommand({
    logPrefix: '[SLEEP SORT] ',
    showTimestamps: true
  });

  invoker.enqueueCommand(configCommand);

  const factory = new ConcreteSortingStrategyFactory<SortableNumber>();
  const strategy = factory.createStrategy(StrategyType.DEFAULT);

  const sorter = new SorterBuilder<SortableNumber>()
    .setArray(sortableArray)
    .setStrategy(strategy)
    .build();

  const sortingCommand = new ExecuteSortingCommand(sorter);
  invoker.enqueueCommand(sortingCommand);
  
  const results = await invoker.executeAll();
  const sortedArray = results[1] as SortableNumber[];
  
  console.log(`\n✅ Custom config result: [${sortedArray.map(x => x.getValue()).join(', ')}]`);
}

// Запуск демонстрации
console.log('\n🎬 Starting demonstration...\n');
demonstrateSorting();

// Можно раскомментировать для других примеров:
// setTimeout(() => demonstrateWithTemplateMethod(), 6000);
// setTimeout(() => demonstrateWithCustomConfig(), 12000);
