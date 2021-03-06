import React, { Component } from 'react';
import Bmap from './Bmap';
import { connect } from 'dva';
import Highlighter from 'react-highlight-words';
import moment from 'moment';
import { formatDate } from '../../../utils/utils';
import { GridContent } from '@ant-design/pro-layout';
import { 
    Card,
    DatePicker,
    Row, 
    Col,
    Form,
    Input,
    Icon,
    Button,
    Table, } from 'antd';
import { PageHeaderWrapper } from '@ant-design/pro-layout';


// function onChange(date, dateString) {
//     console.log(date, dateString);
// }
@connect(({ transportation, loading }) => ({
    transportation,
    loading: loading.effects['transportation/query'],
}))
class transMap extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            dataSource: [],
            count: 0,
            searchText: '',
            searchedColumn: '',
            selectedRowKeys: [],
            pos:null,
        };
        this.columns = [
            {
                title: '配送单号',
                dataIndex: 'transId',
                key: 'transId',
            },
            {
                title: '配送时间',
                dataIndex: 'transDate',
                key: 'transDate',
                sorter: (a, b) => a.transDate - b.transDate,
                sortDirections: ['descend', 'ascend'],
                render: text => `${text}`
                //    render: text => `${text}M`,
            },
            {
                title: '配送线路',
                dataIndex: 'transName',
                key: 'transName',
                ...this.getColumnSearchProps('transName'),
                filters: [
                    {
                        text: '线路一',
                        value: '线路一',
                    },
                    {
                        text: '线路二',
                        value: '线路二',
                    },
                    {
                        text: '线路三',
                        value: '线路三',
                    },
                ],
                filterMultiple: true,
                onFilter: (value, record) => record.transName.indexOf(value) === 0,
            },
            {
                title: '司机名称',
                dataIndex: 'driver.dName',
                key: 'driver.dName',
            },
            {
                title: '司机电话',
                dataIndex: 'driver.dPhone',
                key: 'driver.dPhone',
            },
            {
                title: '客户名称',
                dataIndex: 'outStorage.customer',
                key: 'outStorage.customer',
            },
            {
                title: '出库时间',
                dataIndex: 'outStorage.outDate',
                key: 'outStorage.outDate',
            },
        ];
    }
    componentDidMount(){
        const { dispatch } = this.props;
        dispatch({
            type: 'transportation/queryTransportation',
            callback: (inst, count) => this.setState({ dataSource: inst, count: inst.length }),
        });
        console.log(this.state)
    }

    // 搜索
    getColumnSearchProps = dataIndex => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    ref={node => {
                        this.searchInput = node;
                    }}
                    placeholder={`配送线路 `}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Button
                    type="primary"
                    onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
                    icon="search"
                    size="small"
                    style={{ width: 90, marginRight: 8 }}
                >
                    搜索
        </Button>
                <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                    重置
        </Button>
            </div>
        ),
        filterIcon: filtered => (
            <Icon type="search" style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record) =>
            record[dataIndex]
                .toString()
                .toLowerCase()
                .includes(value.toLowerCase()),
        onFilterDropdownVisibleChange: visible => {
            if (visible) {
                setTimeout(() => this.searchInput.select());
            }
        },
        render: text =>
            this.state.searchedColumn === dataIndex ? (
                <Highlighter
                    searchWords={[this.state.searchText]}
                    autoEscape
                    textToHighlight={text.toString()}
                />
            ) : (
                    text
                ),
    });

    handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        this.setState({
            searchText: selectedKeys[0],
            searchedColumn: dataIndex,
        });
    };

    handleReset = clearFilters => {
        clearFilters();
        this.setState({ searchText: '' });
    };

    onSelectChange = selectedRowKeys => {
        console.log('selectedRowKeys changed: ', selectedRowKeys);
        this.setState({ selectedRowKeys });
    };

    handleFormReset = () => {
        const { form, dispatch } = this.props;
        form.resetFields();
        this.setState({
            formValues: {},
        });
        dispatch({
            type: 'transportation/queryTransportation',
            callback: (inst, count) => this.setState({ dataSource: inst, count: inst.length }),
        });
    };

    handleFormSearch = e => {
        e.preventDefault();
        let data = [];

        const { dispatch, form } = this.props;

        form.validateFields((err, fieldsValue) => {
            if (err) return;
            console.log(fieldsValue.rangeDate._d)
            const { pickDate } = formatDate(fieldsValue.rangeDate._d);
            console.log(pickDate)
            this.setState({
                formValues: pickDate,
            });
            dispatch({
                type: 'transportation/queryByDate',
                payload: { pickDate },
                callback: (inst, count) => this.setState({ dataSource: inst, count: inst.length }),
            });

        });
    };


    renderSimpleForm() {
        const {
            form: { getFieldDecorator },
        } = this.props;
        return (
            <Form onSubmit={this.handleFormSearch} layout="inline">
                <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
                    <Col md={12} sm={24}>
                        <Form.Item label="添加时间">
                            {getFieldDecorator('rangeDate')(<DatePicker />)}
                        </Form.Item>
                    </Col>
                    <Col md={6} sm={24}>
                        <span >
                            <Button type="primary" htmlType="submit">
                                查询
                            </Button>
                            <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                                重置
                            </Button>
                        </span>
                    </Col>
                </Row>
            </Form>
        );
    }
    render() {
        const { dataSource } = this.state;
        for(var i=0;i<dataSource.length;i++){
            console.log(dataSource[i].outStorage)
            if (dataSource[i].outStorage.outState == "分拣中"){
                dataSource.splice(i,1)
                console.log(dataSource[i])
            }
        }
        // console.log(dataSource.outStorage)

        return (
            <PageHeaderWrapper>

            <GridContent>
                <Card bordered={false}>
                    <div>
                        <div >{this.renderSimpleForm()}</div>
                        <br></br>
                        <Table
                            rowKey={record => record.repoId - 1}
                            size="small"
                            dataSource={this.state.dataSource}
                            columns={this.columns}
                        />
                            <div id='container' >
                                <Bmap />
                            </div>
                    </div>
                </Card>
            </GridContent>
            </PageHeaderWrapper>
        )
    }
}
const mapView = Form.create()(transMap);
export default mapView;