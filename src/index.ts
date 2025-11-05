/*
 * Интерфейс для элемента, который можно визуализировать
 */
interface IVisualizable {
  getValue(): number;
  toString(): string;
}

/*
 * Интерфейс наблюдателя для паттерна Observer
 */
interface IObserver<T> {
  update(event: VisualizationEvent<T>): void;
}

/*
 * Интерфейс субъекта для паттерна Observer
 */
interface ISubject<T> {
  attach(observer: IObserver<T>): void;
  detach(observer: IObserver<T>): void;
  notify(event: VisualizationEvent<T>): void;
}

/*
 * Типы событий визуализации
 */
enum EventType {
  STARTED = "STARTED",
  ELEMENT_DISPLAYED = "ELEMENT_DISPLAYED",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

/*
 * Интерфейс события визуализации
 */
interface VisualizationEvent<T> {
  type: EventType;
  element?: T;
  index?: number;
  timestamp: number;
  delay?: number;
  metadata?: Record<string, any>;
}

/*
 * Интерфейс стратегии визуализации
 */
interface IVisualizationStrategy<T extends IVisualizable> {
  visualize(array: T[], context: VisualizationContext<T>): void;
  getName(): string;
  getDescription(): string;
}

/*
 * Интерфейс для фабрики стратегий
 */
interface IVisualizationStrategyFactory<T extends IVisualizable> {
  createStrategy(type: StrategyType): IVisualizationStrategy<T>;
  registerStrategy(
    type: StrategyType,
    strategy: IVisualizationStrategy<T>,
  ): void;
  listAvailableStrategies(): string[];
}

/*
 * Типы стратегий визуализации
 */
enum StrategyType {
  TIMEOUT_FOREACH = "TIMEOUT_FOREACH",
}

/*
 * Конфигурация визуализации
 */
interface VisualizationConfig {
  baseDelayMs: number;
  enableLogging: boolean;
  logPrefix: string;
  showTimestamps: boolean;
  colorize: boolean;
}

/*
 * Обёртка для числового значения с поддержкой визуализации
 */
class VisualizableNumber implements IVisualizable {
  constructor(private readonly value: number) {}

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return `${this.value}`;
  }

  toDetailedString(): string {
    return `VisualizableNumber(${this.value})`;
  }
}

/*
 * Синглтон для управления глобальной конфигурацией
 */
class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: VisualizationConfig;

  private constructor() {
    this.config = {
      baseDelayMs: 1000,
      enableLogging: true,
      logPrefix: "",
      showTimestamps: false,
      colorize: true,
    };
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  getConfig(): Readonly<VisualizationConfig> {
    return Object.freeze({ ...this.config });
  }

  updateConfig(partial: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  resetToDefaults(): void {
    this.config = {
      baseDelayMs: 1000,
      enableLogging: true,
      logPrefix: "🎯",
      showTimestamps: false,
      colorize: true,
    };
  }
}

/*
 * Декоратор для измерения времени выполнения метода
 */
function Measure(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);

    // Для асинхронных операций добавляем callback
    if (result && typeof result.then === "function") {
      return result.then((res: any) => {
        const end = performance.now();
        console.log(
          `${propertyKey} completed in ${(end - start).toFixed(2)}ms`,
        );
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
function ValidateArray(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
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
 * Контекст визуализации, реализующий паттерн Subject
 */
class VisualizationContext<T extends IVisualizable> implements ISubject<T> {
  private observers: Set<IObserver<T>> = new Set();
  private eventHistory: VisualizationEvent<T>[] = [];
  private elementCount: number = 0;

  constructor(private strategyName: string) {}

  attach(observer: IObserver<T>): void {
    this.observers.add(observer);
  }

  detach(observer: IObserver<T>): void {
    this.observers.delete(observer);
  }

  notify(event: VisualizationEvent<T>): void {
    this.eventHistory.push(event);
    this.observers.forEach((observer) => observer.update(event));
  }

  emitStarted(): void {
    const event: VisualizationEvent<T> = {
      type: EventType.STARTED,
      timestamp: Date.now(),
      metadata: { strategy: this.strategyName },
    };
    this.notify(event);
  }

  emitElementDisplayed(element: T, index: number, delay: number): void {
    this.elementCount++;
    const event: VisualizationEvent<T> = {
      type: EventType.ELEMENT_DISPLAYED,
      element,
      index,
      timestamp: Date.now(),
      delay,
      metadata: { totalDisplayed: this.elementCount },
    };
    this.notify(event);
  }

  emitCompleted(): void {
    const event: VisualizationEvent<T> = {
      type: EventType.COMPLETED,
      timestamp: Date.now(),
      metadata: {
        strategy: this.strategyName,
        totalElements: this.elementCount,
      },
    };
    this.notify(event);
  }

  emitError(error: Error): void {
    const event: VisualizationEvent<T> = {
      type: EventType.ERROR,
      timestamp: Date.now(),
      metadata: { error: error.message },
    };
    this.notify(event);
  }

  getEventHistory(): VisualizationEvent<T>[] {
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
class ConsoleLoggingObserver<T extends IVisualizable> implements IObserver<T> {
  private config = ConfigurationManager.getInstance().getConfig();

  update(event: VisualizationEvent<T>): void {
    if (!this.config.enableLogging) return;

    const timestamp = this.config.showTimestamps
      ? `[${new Date(event.timestamp).toISOString()}] `
      : "";

    switch (event.type) {
      case EventType.STARTED:
        console.log(
          `\n${this.config.logPrefix} ${timestamp}Visualization started: ${event.metadata?.strategy}`,
        );
        break;

      case EventType.ELEMENT_DISPLAYED:
        const delayInfo = event.delay ? ` (delay: ${event.delay}ms)` : "";
        console.log(
          `${this.config.logPrefix} ${timestamp}Element ${event.element?.getValue()} displayed${delayInfo}`,
        );
        break;

      case EventType.COMPLETED:
        console.log(
          `${this.config.logPrefix} ${timestamp}Visualization completed: ${event.metadata?.totalElements} elements\n`,
        );
        break;

      case EventType.ERROR:
        console.error(
          `${this.config.logPrefix} ${timestamp}Error: ${event.metadata?.error}`,
        );
        break;
    }
  }
}

/*
 * Наблюдатель для сбора статистики
 */
class StatisticsObserver<T extends IVisualizable> implements IObserver<T> {
  private startTime: number = 0;
  private endTime: number = 0;
  private displayedElements: number = 0;
  private totalDelay: number = 0;
  private events: Map<EventType, number> = new Map();

  update(event: VisualizationEvent<T>): void {
    const currentCount = this.events.get(event.type) || 0;
    this.events.set(event.type, currentCount + 1);

    switch (event.type) {
      case EventType.STARTED:
        this.startTime = event.timestamp;
        break;

      case EventType.ELEMENT_DISPLAYED:
        this.displayedElements++;
        if (event.delay) {
          this.totalDelay += event.delay;
        }
        break;

      case EventType.COMPLETED:
        this.endTime = event.timestamp;
        break;
    }
  }

  getStatistics(): VisualizationStatistics {
    return {
      duration: this.endTime - this.startTime,
      displayedElements: this.displayedElements,
      totalDelay: this.totalDelay,
      averageDelay:
        this.displayedElements > 0
          ? this.totalDelay / this.displayedElements
          : 0,
      eventCounts: new Map(this.events),
    };
  }

  printStatistics(): void {
    const stats = this.getStatistics();
    console.log("\n Visualization Statistics:");
    console.log(`   Duration: ${stats.duration.toFixed(2)}ms`);
    console.log(`   Elements Displayed: ${stats.displayedElements}`);
    console.log(`   Total Delay: ${stats.totalDelay}ms`);
    console.log(`   Average Delay: ${stats.averageDelay.toFixed(2)}ms`);
    console.log("   Event Counts:");
    stats.eventCounts.forEach((count, type) => {
      console.log(`      ${type}: ${count}`);
    });
  }

  reset(): void {
    this.startTime = 0;
    this.endTime = 0;
    this.displayedElements = 0;
    this.totalDelay = 0;
    this.events.clear();
  }
}

interface VisualizationStatistics {
  duration: number;
  displayedElements: number;
  totalDelay: number;
  averageDelay: number;
  eventCounts: Map<EventType, number>;
}

/*
 * Наблюдатель для записи истории визуализации
 */
class HistoryObserver<T extends IVisualizable> implements IObserver<T> {
  private history: Array<{
    event: VisualizationEvent<T>;
    formattedTime: string;
  }> = [];

  update(event: VisualizationEvent<T>): void {
    this.history.push({
      event,
      formattedTime: new Date(event.timestamp).toLocaleTimeString(),
    });
  }

  getHistory(): Array<{ event: VisualizationEvent<T>; formattedTime: string }> {
    return [...this.history];
  }

  printHistory(): void {
    console.log("\n Visualization History:");
    this.history.forEach(({ event, formattedTime }, index) => {
      console.log(
        `   ${index + 1}. [${formattedTime}] ${event.type}${event.element ? ` - ${event.element.getValue()}` : ""}`,
      );
    });
  }

  clear(): void {
    this.history = [];
  }
}

/*
 * Абстрактная базовая стратегия визуализации
 */
abstract class AbstractVisualizationStrategy<T extends IVisualizable>
  implements IVisualizationStrategy<T>
{
  abstract visualize(array: T[], context: VisualizationContext<T>): void;
  abstract getName(): string;
  abstract getDescription(): string;

  protected getConfig(): Readonly<VisualizationConfig> {
    return ConfigurationManager.getInstance().getConfig();
  }
}

/*
 * Стратегия визуализации с использованием setTimeout в forEach
 * Реализация: arr.forEach((t) => setTimeout(() => console.log(t), t))
 */
class TimeoutForEachStrategy<
  T extends IVisualizable,
> extends AbstractVisualizationStrategy<T> {
  @Log
  @ValidateArray
  @Measure
  visualize(array: T[], context: VisualizationContext<T>): void {
    context.emitStarted();

    try {
      // Основная логика: forEach с setTimeout, где задержка = значению элемента
      array.forEach((element, index) => {
        const delayMs = element.getValue();

        setTimeout(() => {
          console.log(element.getValue());

          // Уведомление наблюдателей
          context.emitElementDisplayed(element, index, delayMs);

          // Если это последний элемент, отправляем событие завершения
          if (index === array.length - 1) {
            setTimeout(() => {
              context.emitCompleted();
            }, 10);
          }
        }, delayMs);
      });
    } catch (error) {
      context.emitError(error as Error);
      throw error;
    }
  }

  getName(): string {
    return "setTimeout + forEach Strategy";
  }

  getDescription(): string {
    return "Visualizes array elements using setTimeout with delay equal to element value: arr.forEach((t) => setTimeout(() => console.log(t), t))";
  }
}

/*
 * Конкретная фабрика стратегий визуализации
 */
class ConcreteVisualizationStrategyFactory<T extends IVisualizable>
  implements IVisualizationStrategyFactory<T>
{
  private strategies: Map<StrategyType, IVisualizationStrategy<T>> = new Map();

  constructor() {
    this.registerStrategy(
      StrategyType.TIMEOUT_FOREACH,
      new TimeoutForEachStrategy<T>(),
    );
  }

  createStrategy(type: StrategyType): IVisualizationStrategy<T> {
    const strategy = this.strategies.get(type);

    if (!strategy) {
      throw new Error(
        `Strategy type '${type}' not found. Available: ${this.listAvailableStrategies().join(", ")}`,
      );
    }

    return strategy;
  }

  registerStrategy(
    type: StrategyType,
    strategy: IVisualizationStrategy<T>,
  ): void {
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
 * Построитель для создания визуализатора
 */
class VisualizerBuilder<T extends IVisualizable> {
  private array?: T[];
  private strategy?: IVisualizationStrategy<T>;
  private observers: IObserver<T>[] = [];
  private config?: Partial<VisualizationConfig>;
  private enableDefaultObservers: boolean = true;

  setArray(array: T[]): this {
    this.array = array;
    return this;
  }

  setStrategy(strategy: IVisualizationStrategy<T>): this {
    this.strategy = strategy;
    return this;
  }

  addObserver(observer: IObserver<T>): this {
    this.observers.push(observer);
    return this;
  }

  setConfig(config: Partial<VisualizationConfig>): this {
    this.config = config;
    return this;
  }

  disableDefaultObservers(): this {
    this.enableDefaultObservers = false;
    return this;
  }

  build(): ArrayVisualizer<T> {
    if (!this.array) {
      throw new Error("Array is required to build visualizer");
    }
    if (!this.strategy) {
      throw new Error("Strategy is required to build visualizer");
    }

    // Обновление конфигурации
    if (this.config) {
      ConfigurationManager.getInstance().updateConfig(this.config);
    }

    const visualizer = new ArrayVisualizer(this.array, this.strategy);

    // Добавление наблюдателей по умолчанию
    if (this.enableDefaultObservers) {
      visualizer.addObserver(new ConsoleLoggingObserver<T>());
    }

    // Добавление пользовательских наблюдателей
    this.observers.forEach((observer) => visualizer.addObserver(observer));

    return visualizer;
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
 * Основной класс (фасад) визуализатора массива
 */
class ArrayVisualizer<T extends IVisualizable> {
  private context: VisualizationContext<T>;

  constructor(
    private array: T[],
    private strategy: IVisualizationStrategy<T>,
  ) {
    this.context = new VisualizationContext(strategy.getName());
  }

  addObserver(observer: IObserver<T>): void {
    this.context.attach(observer);
  }

  removeObserver(observer: IObserver<T>): void {
    this.context.detach(observer);
  }

  @Measure
  execute(): void {
    console.log("\n" + "=".repeat(70));
    console.log(` ${this.strategy.getName()}`);
    console.log("=".repeat(70));
    console.log(` ${this.strategy.getDescription()}`);
    console.log(` Array: [${this.array.map((x) => x.getValue()).join(", ")}]`);
    console.log("=".repeat(70));

    this.strategy.visualize([...this.array], this.context);
  }

  getContext(): VisualizationContext<T> {
    return this.context;
  }

  getEventHistory(): VisualizationEvent<T>[] {
    return this.context.getEventHistory();
  }
}

/*
 * Интерфейс команды управления визуализацией
 */
interface ICommand {
  execute(): void;
  getDescription(): string;
}

/*
 * Команда для запуска визуализации
 */
class ExecuteVisualizationCommand<T extends IVisualizable> implements ICommand {
  constructor(private visualizer: ArrayVisualizer<T>) {}

  execute(): void {
    this.visualizer.execute();
  }

  getDescription(): string {
    return "Execute array visualization";
  }
}

/*
 * Команда для обновления конфигурации
 */
class UpdateConfigCommand implements ICommand {
  constructor(private config: Partial<VisualizationConfig>) {}

  execute(): void {
    ConfigurationManager.getInstance().updateConfig(this.config);
    console.log("Configuration updated");
  }

  getDescription(): string {
    return "Update visualization configuration";
  }
}

/*
 * Invoker для команд
 */
class CommandInvoker {
  private commandQueue: ICommand[] = [];
  private executedCommands: ICommand[] = [];

  enqueueCommand(command: ICommand): void {
    this.commandQueue.push(command);
  }

  executeNext(): void {
    const command = this.commandQueue.shift();
    if (command) {
      console.log(`\n🔧 Executing: ${command.getDescription()}`);
      command.execute();
      this.executedCommands.push(command);
    }
  }

  executeAll(): void {
    while (this.commandQueue.length > 0) {
      this.executeNext();
    }
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
 * Абстрактный класс с шаблонным методом для запуска визуализации
 */
abstract class AbstractVisualizationRunner<T extends IVisualizable> {
  run(array: T[], strategyType: StrategyType): void {
    this.beforeRun();

    const factory = new ConcreteVisualizationStrategyFactory<T>();
    const strategy = factory.createStrategy(strategyType);

    const builder = new VisualizerBuilder<T>();
    const visualizer = this.buildVisualizer(builder, array, strategy);

    this.executeVisualization(visualizer);

    this.afterRun();
  }

  protected abstract beforeRun(): void;
  protected abstract afterRun(): void;

  protected buildVisualizer(
    builder: VisualizerBuilder<T>,
    array: T[],
    strategy: IVisualizationStrategy<T>,
  ): ArrayVisualizer<T> {
    return builder.setArray(array).setStrategy(strategy).build();
  }

  protected executeVisualization(visualizer: ArrayVisualizer<T>): void {
    visualizer.execute();
  }
}

/*
 * Конкретный runner с логированием
 */
class LoggingVisualizationRunner<
  T extends IVisualizable,
> extends AbstractVisualizationRunner<T> {
  protected beforeRun(): void {
    console.log("\n Starting visualization process...");
  }

  protected afterRun(): void {
    console.log("\n Visualization process completed.");
  }
}

/*
 * --- Новый код: асинхронная стратегия с поддержкой AbortController и async execute ---
 */

/*
 * Новый интерфейс для асинхронной стратегии с отменой
 */
interface IVisualizationStrategyAsync<T extends IVisualizable> {
  visualize(
    array: T[],
    context: VisualizationContext<T>,
    signal?: AbortSignal,
  ): Promise<void>;
  getName(): string;
  getDescription(): string;
}

/*
 * Асинхронная версия стратегии TimeoutForEachStrategy с поддержкой отмены по AbortSignal
 */
class AsyncTimeoutForEachStrategy<T extends IVisualizable>
  extends AbstractVisualizationStrategy<T>
  implements IVisualizationStrategyAsync<T>
{
  @Log
  @ValidateArray
  @Measure
  async visualize(
    array: T[],
    context: VisualizationContext<T>,
    signal?: AbortSignal,
  ): Promise<void> {
    context.emitStarted();

    try {
      await new Promise<void>((resolve, reject) => {
        let completedCount = 0;

        if (signal?.aborted) {
          context.emitError(new Error("Visualization aborted before start"));
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }

        const onAbort = () => {
          context.emitError(new Error("Visualization aborted"));
          reject(new DOMException("Aborted", "AbortError"));
        };

        signal?.addEventListener("abort", onAbort);

        array.forEach((element, index) => {
          const delayMs = element.getValue();

          const timeoutId = setTimeout(() => {
            if (signal?.aborted) {
              // Не отображаем элементы, если отмена уже произошла
              return;
            }
            console.log(element.getValue());
            context.emitElementDisplayed(element, index, delayMs);
            completedCount++;
            if (completedCount === array.length) {
              signal?.removeEventListener("abort", onAbort);
              context.emitCompleted();
              resolve();
            }
          }, delayMs);
        });
      });
    } catch (error) {
      if ((error as DOMException).name === "AbortError") {
        // специально игнорируем повторный reject
        console.warn("Visualization was aborted.");
      } else {
        context.emitError(error as Error);
        throw error;
      }
    }
  }

  getName(): string {
    return "Async setTimeout + forEach Strategy with Abort";
  }

  getDescription(): string {
    return "Async visualization with setTimeout, supports cancellation via AbortSignal";
  }
}

/*
 * Новый класс визуализатора с поддержкой async и отмены
 */
class ArrayVisualizerAsync<T extends IVisualizable> {
  private context: VisualizationContext<T>;
  private abortController?: AbortController;

  constructor(
    private array: T[],
    private strategy: IVisualizationStrategyAsync<T>,
  ) {
    this.context = new VisualizationContext(strategy.getName());
  }

  addObserver(observer: IObserver<T>): void {
    this.context.attach(observer);
  }

  removeObserver(observer: IObserver<T>): void {
    this.context.detach(observer);
  }

  @Measure
  async execute(signal?: AbortSignal): Promise<void> {
    console.log("\n" + "=".repeat(70));
    console.log(` ${this.strategy.getName()}`);
    console.log("=".repeat(70));
    console.log(` ${this.strategy.getDescription()}`);
    console.log(` Array: [${this.array.map((x) => x.getValue()).join(", ")}]`);
    console.log("=".repeat(70));

    await this.strategy.visualize([...this.array], this.context, signal);
  }

  getContext(): VisualizationContext<T> {
    return this.context;
  }

  getEventHistory(): VisualizationEvent<T>[] {
    return this.context.getEventHistory();
  }

  /*
   * Старт визуализации с возможностью отмены
   */
  startWithAbort(): { promise: Promise<void>; abort: () => void } {
    this.abortController = new AbortController();
    const promise = this.execute(this.abortController.signal);
    return {
      promise,
      abort: () => this.abortController?.abort(),
    };
  }
}

/*
 * Демонстрационная функция с async визуализацией и отменой
 */
async function demoAsyncVisualizationWithAbort() {
  ConfigurationManager.getInstance().updateConfig({
    enableLogging: true,
    logPrefix: "⏳",
    showTimestamps: false,
  });

  console.log("\n Async Visualization with Abort Support Demo \n");

  const numbers = [500, 1000, 1500];
  const visualizableArray = numbers.map((n) => new VisualizableNumber(n));

  const strategy = new AsyncTimeoutForEachStrategy<VisualizableNumber>();

  // Прямое использование нового визуализатора
  const visualizer = new ArrayVisualizerAsync(visualizableArray, strategy);

  visualizer.addObserver(new ConsoleLoggingObserver());
  visualizer.addObserver(new StatisticsObserver());
  visualizer.addObserver(new HistoryObserver());

  // Запуск с возможностью отмены
  const { promise, abort } = visualizer.startWithAbort();

  // Автоматическая отмена через 1200 мс (пример)
  setTimeout(() => {
    console.log("\n!!! Aborting visualization !!!\n");
    abort();
  }, 1200);

  try {
    await promise;
  } catch (e) {
    console.warn("Visualization promise rejected", e);
  }
}

/*
 * --- Оставшийся код демонстраций и примеров ---
 */

function demonstrateVisualization(): void {
  // Настройка конфигурации
  ConfigurationManager.getInstance().updateConfig({
    enableLogging: true,
    logPrefix: ">",
    showTimestamps: false,
  });

  console.log("\n" + "=".repeat(70));
  console.log("ARRAY VISUALIZATION FRAMEWORK");
  console.log("  Using setTimeout + forEach Strategy");
  console.log("=".repeat(70));

  const numbers = [1, 2, 3];
  const visualizableArray = numbers.map((n) => new VisualizableNumber(n));

  console.log(`\n Input array: [${numbers.join(", ")}]`);
  console.log(
    " Each element will be displayed after a delay equal to its value (in milliseconds)\n",
  );

  // Создание фабрики стратегий
  const factory =
    new ConcreteVisualizationStrategyFactory<VisualizableNumber>();
  const strategy = factory.createStrategy(StrategyType.TIMEOUT_FOREACH);

  // Создание наблюдателей
  const statisticsObserver = new StatisticsObserver<VisualizableNumber>();
  const historyObserver = new HistoryObserver<VisualizableNumber>();

  // Использование Builder для создания визуализатора
  const builder = new VisualizerBuilder<VisualizableNumber>();
  const visualizer = builder
    .setArray(visualizableArray)
    .setStrategy(strategy)
    .addObserver(statisticsObserver)
    .addObserver(historyObserver)
    .build();

  // Использование Command для выполнения
  const invoker = new CommandInvoker();
  const visualizationCommand = new ExecuteVisualizationCommand(visualizer);

  invoker.enqueueCommand(visualizationCommand);
  invoker.executeAll();

  // Вывод статистики после завершения (с задержкой)
  setTimeout(() => {
    console.log("\n" + "─".repeat(70));
    statisticsObserver.printStatistics();
    historyObserver.printHistory();
    console.log("\n" + "=".repeat(70));
    console.log("DEMONSTRATION COMPLETED");
    console.log("=".repeat(70) + "\n");
  }, 5000); // Даём время для завершения всех таймаутов
}

/*
 * Пример с использованием Template Method Pattern
 */
function demonstrateWithTemplateMethod(): void {
  const numbers = [1, 2, 3];
  const visualizableArray = numbers.map((n) => new VisualizableNumber(n));

  const runner = new LoggingVisualizationRunner<VisualizableNumber>();
  runner.run(visualizableArray, StrategyType.TIMEOUT_FOREACH);
}

/*
 * Пример с кастомной конфигурацией
 */
function demonstrateWithCustomConfig(): void {
  const numbers = [100, 200, 300];
  const visualizableArray = numbers.map((n) => new VisualizableNumber(n));

  // Обновление конфигурации через Command
  const invoker = new CommandInvoker();
  const configCommand = new UpdateConfigCommand({
    logPrefix: "[TIMEOUT_FOREACH FRAMEWORK] ",
    showTimestamps: true,
  });

  invoker.enqueueCommand(configCommand);

  const factory =
    new ConcreteVisualizationStrategyFactory<VisualizableNumber>();
  const strategy = factory.createStrategy(StrategyType.TIMEOUT_FOREACH);

  const visualizer = new VisualizerBuilder<VisualizableNumber>()
    .setArray(visualizableArray)
    .setStrategy(strategy)
    .build();

  const visualizationCommand = new ExecuteVisualizationCommand(visualizer);
  invoker.enqueueCommand(visualizationCommand);

  invoker.executeAll();
}

// Запуск демонстрации
console.log("\n Starting demonstration...\n");
demonstrateVisualization();

// Раскомментировать для теста async с отменой:
// setTimeout(() => demoAsyncVisualizationWithAbort(), 6000);

// Раскомментировать для других примеров:
// setTimeout(() => demonstrateWithTemplateMethod(), 12000);
// setTimeout(() => demonstrateWithCustomConfig(), 18000);
